from fastapi import Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: dict | None = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}},
    )


def not_found(message: str = "The requested resource was not found.") -> AppError:
    return AppError(status.HTTP_404_NOT_FOUND, "RESOURCE_NOT_FOUND", message)


def conflict(message: str, code: str = "CONFLICT") -> AppError:
    return AppError(status.HTTP_409_CONFLICT, code, message)


def unauthorized(message: str = "Authentication required.", code: str = "UNAUTHORIZED") -> AppError:
    return AppError(status.HTTP_401_UNAUTHORIZED, code, message)


def forbidden(message: str = "You do not have permission to perform this action.", code: str = "FORBIDDEN") -> AppError:
    return AppError(status.HTTP_403_FORBIDDEN, code, message)


def bad_request(message: str, code: str = "BAD_REQUEST", details: dict | None = None) -> AppError:
    return AppError(status.HTTP_400_BAD_REQUEST, code, message, details)
