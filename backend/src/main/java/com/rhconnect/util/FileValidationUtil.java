package com.rhconnect.util;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * Utilitaire de validation des fichiers uploadés.
 * Valide les fichiers en vérifiant les magic bytes (signatures) et l'extension.
 */
public class FileValidationUtil {

    // Magic bytes pour les types de fichiers autorisés
    private static final Map<String, byte[][]> ALLOWED_SIGNATURES = new HashMap<>();
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>();
    private static final int MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB par défaut
    private static final int HEADER_SIZE = 512; // Bytes à lire pour vérifier la signature

    static {
        // PDF: %PDF
        ALLOWED_SIGNATURES.put("pdf", new byte[][] { { 0x25, 0x50, 0x44, 0x46 } });
        
        // Images JPEG: FF D8 FF
        ALLOWED_SIGNATURES.put("jpg", new byte[][] { { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF } });
        ALLOWED_SIGNATURES.put("jpeg", new byte[][] { { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF } });
        
        // PNG: 89 50 4E 47
        ALLOWED_SIGNATURES.put("png", new byte[][] { { (byte) 0x89, 0x50, 0x4E, 0x47 } });
        
        // GIF: 47 49 46
        ALLOWED_SIGNATURES.put("gif", new byte[][] { { 0x47, 0x49, 0x46 } });
        
        // Microsoft Office (DOCX, XLSX, PPTX): PK (ZIP format)
        ALLOWED_SIGNATURES.put("docx", new byte[][] { { 0x50, 0x4B } });
        ALLOWED_SIGNATURES.put("xlsx", new byte[][] { { 0x50, 0x4B } });
        ALLOWED_SIGNATURES.put("pptx", new byte[][] { { 0x50, 0x4B } });
        
        // Word 97-2003 (.doc): D0 CF
        ALLOWED_SIGNATURES.put("doc", new byte[][] { { (byte) 0xD0, (byte) 0xCF } });
        
        // Extensions autorisées
        ALLOWED_EXTENSIONS.addAll(Arrays.asList(
            "pdf", "jpg", "jpeg", "png", "gif", 
            "docx", "doc", "xlsx", "xls", "pptx", "ppt",
            "txt", "csv"
        ));
    }

    /**
     * Valide un fichier uploadé : vérification extension + magic bytes + taille
     * 
     * @param fileName Nom du fichier
     * @param fileInputStream Stream du fichier
     * @param maxSizeBytes Taille maximale autorisée en bytes
     * @return true si le fichier est valide, false sinon
     * @throws IOException En cas d'erreur de lecture
     */
    public static boolean validateFile(String fileName, InputStream fileInputStream, long maxSizeBytes) throws IOException {
        if (fileName == null || fileName.isEmpty()) {
            return false;
        }

        // Extraire l'extension
        String extension = getFileExtension(fileName).toLowerCase();
        
        // Vérifier que l'extension est autorisée
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return false;
        }

        // Lire les premiers bytes du fichier pour vérifier la signature
        byte[] header = readFileHeader(fileInputStream, HEADER_SIZE);
        
        // Vérifier la signature (magic bytes)
        if (!isValidSignature(extension, header)) {
            return false;
        }

        // Vérifier la taille (simple check basé sur le stream)
        if (maxSizeBytes > 0 && header.length > maxSizeBytes) {
            return false;
        }

        return true;
    }

    /**
     * Valide avec taille par défaut (100 MB)
     */
    public static boolean validateFile(String fileName, InputStream fileInputStream) throws IOException {
        return validateFile(fileName, fileInputStream, MAX_FILE_SIZE);
    }

    /**
     * Extrait l'extension du nom de fichier
     */
    private static String getFileExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1) : "";
    }

    /**
     * Lit les N premiers bytes du fichier
     */
    private static byte[] readFileHeader(InputStream inputStream, int headerSize) throws IOException {
        byte[] header = new byte[headerSize];
        int bytesRead = inputStream.read(header);
        
        if (bytesRead < 0) {
            return new byte[0];
        }
        
        // Retourner seulement les bytes lus
        byte[] result = new byte[bytesRead];
        System.arraycopy(header, 0, result, 0, bytesRead);
        return result;
    }

    /**
     * Vérifie si la signature du fichier correspond à l'extension déclarée
     */
    private static boolean isValidSignature(String extension, byte[] fileHeader) {
        if (fileHeader == null || fileHeader.length == 0) {
            return false;
        }

        byte[][] signatures = ALLOWED_SIGNATURES.get(extension);
        if (signatures == null) {
            return "txt".equals(extension) || "csv".equals(extension);
        }

        // Vérifier si l'en-tête commence par l'une des signatures connues
        for (byte[] signature : signatures) {
            if (startsWith(fileHeader, signature)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Vérifie si le tableau commence par le préfixe
     */
    private static boolean startsWith(byte[] data, byte[] prefix) {
        if (prefix.length > data.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Retourne l'ensemble des extensions autorisées
     */
    public static Set<String> getAllowedExtensions() {
        return new HashSet<>(ALLOWED_EXTENSIONS);
    }

    /**
     * Ajoute une nouvelle extension autorisée (pour configuration dynamique)
     */
    public static void addAllowedExtension(String extension, byte[][] signatures) {
        ALLOWED_EXTENSIONS.add(extension.toLowerCase());
        ALLOWED_SIGNATURES.put(extension.toLowerCase(), signatures);
    }
}
