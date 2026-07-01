package errors

import "net/http"

type ErrorResponse struct {
	StatusCode int         `json:"status_code"`
	ErrorCode  string      `json:"error_code"`
	Message    string      `json:"message"`
	Details    interface{} `json:"details,omitempty"`
}

type HTTPError interface {
	Error() string
	StatusCode() int
	Body() ErrorResponse
}

type httpError struct {
	statusCode int
	errorCode  string
	message    string
	details    interface{}
}

func (e *httpError) Error() string { return e.message }

func (e *httpError) StatusCode() int { return e.statusCode }

func (e *httpError) Body() ErrorResponse {
	return ErrorResponse{
		StatusCode: e.statusCode,
		ErrorCode:  e.errorCode,
		Message:    e.message,
		Details:    e.details,
	}
}

func newHTTPError(status int, message, code string) HTTPError {
	return &httpError{statusCode: status, errorCode: code, message: message}
}

// NewBadRequest crea un error 400 (datos inválidos, JSON malformado).
func NewBadRequest(message, code string) HTTPError {
	return newHTTPError(http.StatusBadRequest, message, code)
}

// NewNotFound crea un error 404 (recurso no encontrado).
func NewNotFound(message, code string) HTTPError {
	return newHTTPError(http.StatusNotFound, message, code)
}

// NewInternalServerError crea un error 500 (error inesperado del servidor).
func NewInternalServerError(message, code string) HTTPError {
	return newHTTPError(http.StatusInternalServerError, message, code)
}
