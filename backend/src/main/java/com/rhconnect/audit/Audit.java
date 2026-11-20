package com.rhconnect.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audit {

    String action();

    String entityType() default "";

    boolean captureEntityIdFromArg() default false;

    int entityIdArgIndex() default 0;
}
