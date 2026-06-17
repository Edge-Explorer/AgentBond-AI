import os

prom_path = "/code/prometheus.yml"
grafana_key = os.environ.get("GRAFANA_API_KEY")

if os.path.exists(prom_path) and grafana_key:
    try:
        with open(prom_path, "r") as f:
            content = f.read()
        
        # Replace the placeholder with the actual key
        if "${GRAFANA_API_KEY}" in content:
            new_content = content.replace("${GRAFANA_API_KEY}", grafana_key)
            with open(prom_path, "w") as f:
                f.write(new_content)
            print("Successfully injected GRAFANA_API_KEY into prometheus.yml")
        else:
            print("Placeholder ${GRAFANA_API_KEY} not found in prometheus.yml")
    except Exception as e:
        print(f"Error modifying prometheus.yml: {e}")
else:
    print("Prometheus config file or GRAFANA_API_KEY missing!")
