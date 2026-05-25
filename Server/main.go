package main

import (
	"cloudflare-tools/server/config"
	"cloudflare-tools/server/handler"
	"cloudflare-tools/server/models"
	"embed"
	"io/fs"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

//go:embed dist/*
var content embed.FS

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Printf("Warning: Failed to load config.yaml: %v", err)
	}
	if err := models.LoadAccounts(); err != nil {
		log.Printf("Warning: Failed to load accounts.json: %v", err)
	}

	r := gin.Default()

	r.POST("/api/login", handler.Login)

	r.GET("/api/certs/download/:filename", handler.DownloadCert)

	api := r.Group("/api")
	api.Use(handler.AuthMiddleware())
	{
		api.GET("/accounts", handler.ListAccounts)
		api.POST("/accounts", handler.AddAccount)
		api.POST("/accounts/test", handler.TestAccount)
		api.DELETE("/accounts/:id", handler.DeleteAccount)
		api.POST("/zones/batch-add", handler.BatchAddZones)
		api.POST("/zones/batch-delete", handler.BatchDeleteZones)
		api.POST("/zones/export", handler.ExportZones)
		api.POST("/dns/batch-parse", handler.BatchParseDNS)
		api.POST("/dns/batch-delete", handler.BatchDeleteDNS)
		api.POST("/dns/proxy-toggle", handler.BatchProxyToggle)
		api.POST("/ssl/batch-settings", handler.BatchSSLSettings)
		api.POST("/certs/batch-apply", handler.BatchApplyCert)
		api.GET("/certs/list", handler.ListCerts)
		api.POST("/rules/batch-copy", handler.BatchCopyRules)
		api.POST("/rules/batch-delete", handler.BatchDeleteRules)
		api.POST("/cache/batch-settings", handler.BatchCacheSettings)
		api.POST("/optimization/batch-settings", handler.BatchOptimization)
		api.POST("/bulk-settings/batch-apply", handler.BatchBulkSettings)
		api.POST("/email/batch-routing", handler.BatchEmailRouting)
		api.POST("/email/batch-delete", handler.BatchDeleteEmailRouting)
	}

	dist, err := fs.Sub(content, "dist")
	if err != nil {
		log.Fatal(err)
	}
	r.NoRoute(gin.WrapH(http.FileServer(http.FS(dist))))

	log.Println("Server starting on :8080")
	r.Run(":8080")
}
