package com.rhconnect.service;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.util.FileValidationUtil;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final GridFsTemplate gridFsTemplate;
    private final GridFsOperations gridFsOperations;

    /**
     * Upload un fichier après validation de la signature (magic bytes) et de l'extension.
     * Sécurité: Empêche les uploads de fichiers malveillants
     */
    public String uploadFile(String filename, MultipartFile file) throws IOException {
        // Validation du fichier (magic bytes + extension sur le nom d'origine)
        String nameToValidate = (file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank())
                ? file.getOriginalFilename()
                : filename;

        if (!FileValidationUtil.validateFile(nameToValidate, file.getInputStream())) {
            throw new BusinessException(
                "Fichier invalide. Type ou extension non autorisé", 
                "INVALID_FILE_TYPE"
            );
        }

        if (file.getSize() > 100 * 1024 * 1024) { // 100 MB max
            throw new BusinessException(
                "Fichier trop volumineux. Maximum 100 MB", 
                "FILE_TOO_LARGE"
            );
        }

        DBObject metadata = new BasicDBObject();
        metadata.put("fileSize", file.getSize());
        metadata.put("contentType", file.getContentType());
        metadata.put("originalFilename", file.getOriginalFilename());
        metadata.put("uploadedAt", System.currentTimeMillis());

        ObjectId fileId = gridFsTemplate.store(
                file.getInputStream(),
                filename,
                file.getContentType(),
                metadata
        );

        return fileId.toString();
    }

    public org.springframework.core.io.Resource downloadFile(String fileId) {
        if (fileId == null || fileId.isBlank() || !isValidObjectId(fileId)) {
            throw new BusinessException("Fichier introuvable", "FILE_NOT_FOUND");
        }

        var gridFsFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(new ObjectId(fileId))));
        if (gridFsFile == null) {
            throw new BusinessException("Fichier introuvable", "FILE_NOT_FOUND");
        }
        return gridFsOperations.getResource(gridFsFile);
    }

    public void deleteFile(String fileId) {
        if (fileId == null || fileId.isBlank() || !isValidObjectId(fileId)) {
            return;
        }
        try {
            gridFsTemplate.delete(new Query(Criteria.where("_id").is(new ObjectId(fileId))));
        } catch (Exception e) {
            throw new BusinessException("Erreur suppression fichier: " + e.getMessage(), "FILE_DELETE_ERROR");
        }
    }

    private boolean isValidObjectId(String fileId) {
        try {
            new ObjectId(fileId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
