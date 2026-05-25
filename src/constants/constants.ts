export const SHUTDOWN_TIMEOUT_MS = 10000;

export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500,
}

export enum AssetFit {
    COVER = 'cover',
    CONTAIN = 'contain',
    FILL = 'fill',
    INSIDE = 'inside',
    OUTSIDE = 'outside',
}

export const EXPORT_CONFIG = {
    JSON_TAB_SPACE: 4,
    ZIP_COMPRESSION_LEVEL: 9,
    DATA_FILE_NAME: "data.json",
};

export const CONSTANTS = {
    SHUTDOWN_TIMEOUT_MS,
};
