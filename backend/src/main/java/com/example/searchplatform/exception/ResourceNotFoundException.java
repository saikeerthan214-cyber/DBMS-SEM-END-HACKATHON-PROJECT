package com.example.searchplatform.exception;

public class ResourceNotFoundException extends RuntimeException {
    private final String resourceName;
    private final Long   resourceId;

    public ResourceNotFoundException(String resourceName, Long id) {
        super(resourceName + " with id " + id + " not found");
        this.resourceName = resourceName;
        this.resourceId   = id;
    }

    public String getResourceName() { return resourceName; }
    public Long   getResourceId()   { return resourceId; }
}
