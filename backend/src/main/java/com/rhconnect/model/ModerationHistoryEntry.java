package com.rhconnect.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationHistoryEntry {

    public enum ModerationAction {
        APPROVE,
        REJECT,
        REQUEST_EDIT
    }

    private String actorId;
    private ModerationAction action;
    private String comment;
    private Instant timestamp;
}
