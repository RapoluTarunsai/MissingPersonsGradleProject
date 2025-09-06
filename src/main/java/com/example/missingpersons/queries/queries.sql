/*
-- Users Table
create table USERS
(
    ID                   NUMBER       default "SYSTEM"."USER_SEQ"."NEXTVAL" not null
        primary key,
    NAME                 VARCHAR2(100)                                      not null,
    EMAIL                VARCHAR2(100)                                      not null
        unique,
    LOCATION             VARCHAR2(100)                                      not null,
    PASSWORD             VARCHAR2(100)                                      not null,
    VERIFICATION_CODE    VARCHAR2(6),
    IS_LOGGED_IN         NUMBER(1)    default 0
        constraint CHK_IS_LOGGED_IN
            check (IS_LOGGED_IN IN (0, 1)),
    LAST_LOGIN_TIMESTAMP TIMESTAMP(6) default SYSTIMESTAMP,
    PROFILE_PICTURE      BLOB
)
/

create index IDX_USER_LOGIN_STATUS
    on USERS (IS_LOGGED_IN)
/



-- Missing Persons Table
create table MISSING_PERSONS
(
    ID            NUMBER       default "SYSTEM"."MISSING_PERSON_SEQ"."NEXTVAL" not null
        primary key,
    NAME          VARCHAR2(100)                                                not null,
    IMAGE_DATA    BLOB                                                         not null,
    USER_ID       NUMBER                                                       not null
        references USERS,
    DESCRIPTION   VARCHAR2(4000)                                               not null,
    LAST_SEEN     TIMESTAMP(6)                                                 not null,
    STATUS        VARCHAR2(10) default 'MISSING',
    AGE           NUMBER,
    LOCATION      VARCHAR2(255),
    CITY          VARCHAR2(100),
    STATE         VARCHAR2(100),
    COUNTRY       VARCHAR2(100),
    REPORTED_TIME TIMESTAMP(6),
    VIDEO_DATA    BLOB
        constraint CHK_VIDEO_DATA_SIZE
            check (LENGTHB(video_data) <= 20971520)
)
/



-- Matched Persons Table
create table MATCHED_PERSONS
(
    ID                 NUMBER(19)   default "SYSTEM"."MATCHED_PERSON_SEQ"."NEXTVAL" not null
        primary key,
    MISSING_PERSON_ID  NUMBER(19)                                                   not null
        constraint FK_MATCHED_PERSON_MISSING_PERSON
            references MISSING_PERSONS
                on delete cascade,
    REPORTED_BY_ID     NUMBER(19)                                                   not null
        constraint FK_MATCHED_PERSON_REPORTED_BY
            references USERS,
    FOUND_BY_ID        NUMBER(19)                                                   not null
        constraint FK_MATCHED_PERSON_FOUND_BY
            references USERS,
    MATCHED_AT         TIMESTAMP(6) default CURRENT_TIMESTAMP                       not null,
    APPROVED           NUMBER(1)    default 0                                       not null,
    MATCHED_IMAGE_DATA BLOB,
    MESSAGE            VARCHAR2(1000)
)
/



-- Comments Table
CREATE TABLE COMMENTS (
                          id BIGINT PRIMARY KEY,
                          content VARCHAR(255) NOT NULL,
                          user_id BIGINT NOT NULL,
                          missing_person_id BIGINT NOT NULL,
                          created_at TIMESTAMP NOT NULL,
                          FOREIGN KEY (user_id) REFERENCES USERS(id),
                          FOREIGN KEY (missing_person_id) REFERENCES MISSING_PERSONS(id)
);

-- Sequences for ID generation
CREATE SEQUENCE USER_SEQ START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE MISSING_PERSON_SEQ START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE MATCHED_PERSON_SEQ START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE COMMENT_SEQ START WITH 1 INCREMENT BY 1;
*/
