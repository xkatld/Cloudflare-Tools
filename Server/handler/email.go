package handler

import (
	"bytes"
	"cloudflare-tools/server/models"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

type BatchEmailRoutingRequest struct {
	AccountID string   `json:"accountId"`
	Domains   []string `json:"domains"`
	Worker    string   `json:"worker"`
}

type EmailRoutingResult struct {
	Domain  string `json:"domain"`
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func BatchEmailRouting(c *gin.Context) {
	var req BatchEmailRoutingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var acc *models.Account
	for _, a := range models.Accounts {
		if a.ID == req.AccountID {
			acc = &a
			break
		}
	}

	if acc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	results := make([]EmailRoutingResult, len(req.Domains))
	var wg sync.WaitGroup

	for i, domain := range req.Domains {
		wg.Add(1)
		go func(idx int, dom string) {
			defer wg.Done()
			success, msg := processEmailRouting(acc, dom, req.Worker)
			results[idx] = EmailRoutingResult{
				Domain:  dom,
				Success: success,
				Message: msg,
			}
		}(i, domain)
	}

	wg.Wait()
	c.JSON(http.StatusOK, results)
}

func processEmailRouting(acc *models.Account, domain string, workerName string) (bool, string) {
	zoneID, err := getZoneID(acc, domain)
	if err != nil {
		return false, err.Error()
	}

	if ok, msg := enableEmailRouting(acc, zoneID); !ok {
		return false, "Enable routing failed: " + msg
	}

	if ok, msg := setCatchAllRule(acc, zoneID, workerName); !ok {
		return false, "Set catch-all rule failed: " + msg
	}

	return true, "Success"
}

func enableEmailRouting(acc *models.Account, zoneID string) (bool, string) {
	url := fmt.Sprintf("https://api.cloudflare.com/client/v4/zones/%s/email/routing/dns", zoneID)
	req, _ := http.NewRequest("POST", url, nil)
	req.Header.Add("X-Auth-Email", acc.Email)
	req.Header.Add("X-Auth-Key", acc.Key)
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, "Request failed"
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		return true, "Success"
	}

	respBody, _ := ioutil.ReadAll(resp.Body)
	return false, fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(respBody))
}

func setCatchAllRule(acc *models.Account, zoneID string, workerName string) (bool, string) {
	payload := map[string]interface{}{
		"matchers": []map[string]interface{}{
			{"type": "all"},
		},
		"actions": []map[string]interface{}{
			{
				"type":  "worker",
				"value": []string{workerName},
			},
		},
		"enabled": true,
	}
	body, _ := json.Marshal(payload)

	url := fmt.Sprintf("https://api.cloudflare.com/client/v4/zones/%s/email/routing/rules/catch_all", zoneID)
	req, _ := http.NewRequest("PUT", url, bytes.NewBuffer(body))
	req.Header.Add("X-Auth-Email", acc.Email)
	req.Header.Add("X-Auth-Key", acc.Key)
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, "Request failed"
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return true, "Success"
	}

	respBody, _ := ioutil.ReadAll(resp.Body)
	return false, fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(respBody))
}

type BatchDeleteEmailRoutingRequest struct {
	AccountID string   `json:"accountId"`
	Domains   []string `json:"domains"`
}

func BatchDeleteEmailRouting(c *gin.Context) {
	var req BatchDeleteEmailRoutingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	var acc *models.Account
	for _, a := range models.Accounts {
		if a.ID == req.AccountID {
			acc = &a
			break
		}
	}
	if acc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}
	results := make([]EmailRoutingResult, len(req.Domains))
	var wg sync.WaitGroup
	for i, domain := range req.Domains {
		wg.Add(1)
		go func(idx int, dom string) {
			defer wg.Done()
			success, msg := processDeleteEmailRouting(acc, dom)
			results[idx] = EmailRoutingResult{
				Domain:  dom,
				Success: success,
				Message: msg,
			}
		}(i, domain)
	}
	wg.Wait()
	c.JSON(http.StatusOK, results)
}

func processDeleteEmailRouting(acc *models.Account, domain string) (bool, string) {
	zone_id, err := getZoneID(acc, domain)
	if err != nil {
		return false, err.Error()
	}
	if ok, msg := disableEmailRouting(acc, zone_id); !ok {
		return false, "Disable routing failed: " + msg
	}
	return true, "Success"
}

func disableEmailRouting(acc *models.Account, zone_id string) (bool, string) {
	url := fmt.Sprintf("https://api.cloudflare.com/client/v4/zones/%s/email/routing/disable", zone_id)
	req, _ := http.NewRequest("POST", url, nil)
	req.Header.Add("X-Auth-Email", acc.Email)
	req.Header.Add("X-Auth-Key", acc.Key)
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, "Request failed"
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		return true, "Success"
	}
	resp_body, _ := ioutil.ReadAll(resp.Body)
	return false, fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(resp_body))
}

