# AURA Luxe Atelier

AURA Luxe Atelier is a Python/Flask storefront demo for a luxury e-commerce brand. It renders a responsive product catalog and provides JSON APIs for browsing products, categories, and a simulated checkout.

## Features

- Server-rendered storefront at `/`
- Product catalog, category filtering, and text search
- Product and category REST APIs
- Simulated checkout endpoint
- Unit tests for the UI route and API responses
- Docker support for repeatable deployments

## Requirements

- Python 3.9 or later
- `pip`
- Docker (optional, for containerized use and EC2 deployment)

## Run locally

The included script creates a virtual environment on first use, installs dependencies, and starts the application:

```bash
chmod +x run.sh
./run.sh
```

Open [http://localhost:5000](http://localhost:5000). Set `PORT` to use a different port:

```bash
PORT=8080 ./run.sh
```

Alternatively, install and run manually:

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python app.py
```

## Test

```bash
./venv/bin/python -m unittest discover -s tests
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/products` | Lists all products. Supports `category` and `q` query parameters. |
| `GET` | `/api/products/<id>` | Returns one product, or `404` when it does not exist. |
| `GET` | `/api/categories` | Lists catalog categories. |
| `POST` | `/api/checkout` | Simulates checkout for a JSON body containing an `items` array. |

Example search:

```bash
curl 'http://localhost:5000/api/products?category=watches&q=gold'
```

Example checkout:

```bash
curl -X POST http://localhost:5000/api/checkout \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":1,"price":1450.00,"quantity":1}]}'
```

## Docker

Build and run the container locally:

```bash
docker build -t aura-luxe-atelier .
docker run --rm -p 5000:5000 aura-luxe-atelier
```

The application listens on port `5000` by default. Supply `-e PORT=<port>` and map the same container port if you change it.

## CI/CD deployment to Amazon EC2

The intended CI/CD pipeline is:

```text
Push or pull request → run unit tests → build Docker image → push image to registry
main branch only       → connect to EC2 over SSH → pull image → replace running container
```

Use GitHub Actions (or an equivalent CI system) to run the tests on every pull request and to deploy only after a successful push to `main`. Store the deploy credentials as repository secrets, never in the workflow file:

| Secret | Purpose |
| --- | --- |
| `EC2_HOST` | Public IP address or DNS name of the EC2 instance. |
| `EC2_USER` | SSH user, commonly `ubuntu` or `ec2-user`. |
| `EC2_SSH_KEY` | Private SSH key permitted to access the instance. |
| `REGISTRY_USERNAME` | Container-registry user name. |
| `REGISTRY_TOKEN` | Registry access token with permission to push and pull the image. |

### Prepare the EC2 instance

1. Launch an EC2 instance and allow inbound TCP port `22` only from trusted administration networks and port `80` (or `5000` for a non-production demonstration) from the required clients.
2. Install Docker and enable it at boot:

   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   ```

   On Amazon Linux, use its Docker package manager commands instead.

3. Log out and back in so the Docker group change takes effect. Authenticate to the chosen image registry on the instance, or have the deployment workflow perform that login over SSH.

4. Start the application from the published image:

   ```bash
   docker pull <registry-user>/aura-luxe-atelier:latest
   docker rm -f aura-luxe-atelier 2>/dev/null || true
   docker run -d --name aura-luxe-atelier --restart unless-stopped \
     -p 80:5000 <registry-user>/aura-luxe-atelier:latest
   ```

For production, place a TLS-enabled reverse proxy such as Nginx or an AWS Application Load Balancer in front of the container. Do not expose SSH broadly or store private keys in the repository.

### Pipeline deployment commands

After tests pass, the CI job should build and tag an immutable image (for example, with the commit SHA), push it to the registry, then run equivalent commands on EC2:

```bash
docker pull <registry-user>/aura-luxe-atelier:<commit-sha>
docker rm -f aura-luxe-atelier 2>/dev/null || true
docker run -d --name aura-luxe-atelier --restart unless-stopped \
  -p 80:5000 <registry-user>/aura-luxe-atelier:<commit-sha>
```

Using the commit SHA instead of only `latest` makes deployed versions traceable and allows a quick rollback by starting a previous known-good image tag.
