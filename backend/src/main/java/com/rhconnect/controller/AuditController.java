package com.rhconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rhconnect.audit.AuditLog;
import com.rhconnect.audit.AuditLogRepository;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Instant dateFrom,
            @RequestParam(required = false) Instant dateTo,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {

        Instant from = dateFrom != null ? dateFrom : LocalDate.of(2000, 1, 1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = dateTo != null ? dateTo : Instant.now().plusSeconds(86400);

        Page<AuditLog> page;

        if (actorId != null && action != null && entityType != null) {
            page = auditLogRepository.findByActorIdAndActionAndEntityTypeAndTimestampBetween(
                    actorId, action, entityType, from, to, pageable);
        } else if (actorId != null && action != null) {
            page = auditLogRepository.findByActorIdAndActionAndTimestampBetween(actorId, action, from, to, pageable);
        } else if (actorId != null && entityType != null) {
            page = auditLogRepository.findByActorIdAndEntityTypeAndTimestampBetween(actorId, entityType, from, to, pageable);
        } else if (action != null && entityType != null) {
            page = auditLogRepository.findByActionAndEntityTypeAndTimestampBetween(action, entityType, from, to, pageable);
        } else if (actorId != null) {
            page = auditLogRepository.findByActorIdAndTimestampBetween(actorId, from, to, pageable);
        } else if (action != null) {
            page = auditLogRepository.findByActionAndTimestampBetween(action, from, to, pageable);
        } else if (entityType != null) {
            page = auditLogRepository.findByEntityTypeAndTimestampBetween(entityType, from, to, pageable);
        } else {
            page = auditLogRepository.findByTimestampBetween(from, to, pageable);
        }

        return ResponseEntity.ok(page);
    }

    @GetMapping(value = "/export.csv", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Instant dateFrom,
            @RequestParam(required = false) Instant dateTo) throws IOException {

        Instant from = dateFrom != null ? dateFrom : LocalDate.of(2000, 1, 1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = dateTo != null ? dateTo : Instant.now().plusSeconds(86400);

        List<AuditLog> allLogs;

        if (actorId != null && action != null && entityType != null) {
            allLogs = auditLogRepository.findByActorIdAndActionAndEntityTypeAndTimestampBetween(
                    actorId, action, entityType, from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else if (actorId != null && action != null) {
            allLogs = auditLogRepository.findByActorIdAndActionAndTimestampBetween(
                    actorId, action, from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else if (actorId != null && entityType != null) {
            allLogs = auditLogRepository.findByActorIdAndEntityTypeAndTimestampBetween(
                    actorId, entityType, from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else if (action != null && entityType != null) {
            allLogs = auditLogRepository.findByActionAndEntityTypeAndTimestampBetween(
                    action, entityType, from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else if (actorId != null) {
            allLogs = auditLogRepository.findByActorIdAndTimestampBetween(
                    actorId, from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else if (action != null) {
            allLogs = auditLogRepository.findByActionAndTimestampBetween(
                    action, from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else if (entityType != null) {
            allLogs = auditLogRepository.findByEntityTypeAndTimestampBetween(
                    entityType, from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        } else {
            allLogs = auditLogRepository.findByTimestampBetween(
                    from, to,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        }

        StringBuilder csvContent = new StringBuilder();
        csvContent.append("id,actorEmail,action,entityType,entityId,ip,timestamp,details_json_brief\n");

        for (AuditLog log : allLogs) {
            csvContent.append(escapeCsv(log.getId())).append(",");
            csvContent.append(escapeCsv(log.getActorEmail())).append(",");
            csvContent.append(escapeCsv(log.getAction())).append(",");
            csvContent.append(escapeCsv(log.getEntityType())).append(",");
            csvContent.append(escapeCsv(log.getEntityId())).append(",");
            csvContent.append(escapeCsv(log.getIp())).append(",");
            csvContent.append(escapeCsv(log.getTimestamp() != null ? log.getTimestamp().toString() : "")).append(",");
            csvContent.append(escapeCsv(truncateDetailsToJson(log.getDetails(), 300))).append("\n");
        }

        byte[] bom = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] csvBytes = csvContent.toString().getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[bom.length + csvBytes.length];
        System.arraycopy(bom, 0, result, 0, bom.length);
        System.arraycopy(csvBytes, 0, result, bom.length, csvBytes.length);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "audit_logs.csv");
        headers.setContentLength(result.length);

        return new ResponseEntity<>(result, headers, 200);
    }

    private String truncateDetailsToJson(Object details, int maxLen) {
        if (details == null) return "";
        try {
            String json = objectMapper.writeValueAsString(details);
            if (json.length() > maxLen) {
                return json.substring(0, maxLen) + "...";
            }
            return json;
        } catch (Exception e) {
            return String.valueOf(details);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
