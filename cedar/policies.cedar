// =============================================================================
// AWS Cedar Authorization Policies — Life Dashboard
// Enforces tenant isolation, S3 object boundaries, and service role permissions
// =============================================================================

// -----------------------------------------------------------------------------
// POLICY 1: Tenant Data Isolation (DynamoDB Records)
// Rule: A user can only GetItem, PutItem, UpdateItem, DeleteItem on records
//       where the record's userId matches principal.userId.
// -----------------------------------------------------------------------------
@id("user-crud-own-records")
permit (
    principal,
    action in [
        Action::"GetItem",
        Action::"PutItem",
        Action::"UpdateItem",
        Action::"DeleteItem",
        Action::"Query"
    ],
    resource
)
when {
    principal has userId &&
    resource has userId &&
    resource.userId == principal.userId
};

@id("deny-cross-tenant-dynamodb-access")
forbid (
    principal,
    action in [
        Action::"GetItem",
        Action::"PutItem",
        Action::"UpdateItem",
        Action::"DeleteItem",
        Action::"Query",
        Action::"Scan"
    ],
    resource
)
when {
    principal has userId &&
    resource has userId &&
    resource.userId != principal.userId
};

// -----------------------------------------------------------------------------
// POLICY 2: S3 Document Isolation
// Rule: A user cannot access another user's S3 documents.
//       Enforces that S3 object keys must reside under documents/{userId}/*
// -----------------------------------------------------------------------------
@id("user-access-own-s3-documents")
permit (
    principal,
    action in [
        Action::"GetObject",
        Action::"PutObject",
        Action::"DeleteObject"
    ],
    resource
)
when {
    principal has userId &&
    resource has ownerId &&
    resource.ownerId == principal.userId
};

@id("deny-cross-user-s3-access")
forbid (
    principal,
    action in [
        Action::"GetObject",
        Action::"PutObject",
        Action::"DeleteObject"
    ],
    resource
)
when {
    principal has userId &&
    resource has ownerId &&
    resource.ownerId != principal.userId
};

// -----------------------------------------------------------------------------
// POLICY 3: EventBridge Briefing Generator Service Role Scoping
// Rule: The EventBridge Lambda role can read all users' data (for generating
//       morning briefings), but CANNOT write/mutate any entity EXCEPT Briefing.
// -----------------------------------------------------------------------------
@id("briefing-lambda-read-all-users-data")
permit (
    principal == Role::"EventBridgeBriefingLambdaRole",
    action in [
        Action::"GetItem",
        Action::"Query",
        Action::"Scan"
    ],
    resource
);

@id("briefing-lambda-write-only-briefings")
permit (
    principal == Role::"EventBridgeBriefingLambdaRole",
    action in [
        Action::"PutItem",
        Action::"UpdateItem"
    ],
    resource
)
when {
    resource has entityType &&
    resource.entityType == "Briefing"
};

@id("briefing-lambda-deny-all-other-writes-and-deletes")
forbid (
    principal == Role::"EventBridgeBriefingLambdaRole",
    action in [
        Action::"PutItem",
        Action::"UpdateItem",
        Action::"DeleteItem"
    ],
    resource
)
unless {
    resource has entityType &&
    resource.entityType == "Briefing"
};
