REMOTEHOST?=foobar

deploy:
	rsync -avzp -e ssh --exclude='*.env' --exclude='*.git' ./ root@$(REMOTEHOST):/root/RadicalVPN_WG-Adapter