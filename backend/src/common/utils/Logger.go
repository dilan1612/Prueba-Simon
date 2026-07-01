package utils

import (
	"log"
	"sync"
)

type ILogger interface {
	Info(message string)
	Success(message string)
	Warn(message string)
	Error(message string)
	Fatal(message string)
}

type logger struct{}

var (
	loggerInstance *logger
	loggerOnce     sync.Once
)

// NewLogger retorna la instancia única del logger (Singleton con sync.Once).
func NewLogger() ILogger {
	loggerOnce.Do(func() {
		loggerInstance = &logger{}
	})
	return loggerInstance
}

func (l *logger) Info(message string)    { log.Printf("[INFO]    %s", message) }
func (l *logger) Success(message string) { log.Printf("[SUCCESS] %s", message) }
func (l *logger) Warn(message string)    { log.Printf("[WARN]    %s", message) }
func (l *logger) Error(message string)   { log.Printf("[ERROR]   %s", message) }
func (l *logger) Fatal(message string)   { log.Fatalf("[FATAL]   %s", message) }
