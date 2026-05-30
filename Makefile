.PHONY: tag_version delete_tag list_tags

GIT := $(shell which git)

ifeq ($(APP_VERSION),)
	APP_VERSION = $(shell $(GIT) describe --tags --abbrev=0 2>/dev/null)
endif

tag_version:
ifndef APP_VERSION
	$(error APP_VERSION is required. Usage: make tag_version APP_VERSION=v0.1.0)
endif
	@echo "Creating tag $(APP_VERSION) for yojak-frontend-v2..."
	@$(GIT) tag -a $(APP_VERSION) -m "Release $(APP_VERSION)"
	@$(GIT) push origin $(APP_VERSION)
	@echo "Tag $(APP_VERSION) pushed successfully."

delete_tag:
ifndef APP_VERSION
	$(error APP_VERSION is required. Usage: make delete_tag APP_VERSION=v0.1.0)
endif
	@echo "Deleting tag $(APP_VERSION)..."
	@$(GIT) tag -d $(APP_VERSION) 2>/dev/null || echo "Tag $(APP_VERSION) not found locally, skipping..."
	@$(GIT) push origin --delete $(APP_VERSION) 2>/dev/null || echo "Tag $(APP_VERSION) not found on remote, skipping..."
	@echo "Done."

list_tags:
	@$(GIT) tag -l --sort=-version:refname
