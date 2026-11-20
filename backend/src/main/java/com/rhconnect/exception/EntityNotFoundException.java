package com.rhconnect.exception;

public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String entity, String id) {
        super(entity + " introuvable avec l'identifiant : " + id);
    }
}
