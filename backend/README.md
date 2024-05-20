# Build the ollama image
docker pull ollama/ollama

# Build the main app image
docker build -t grant_app .

# Create the network
docker network create django-ollama-service

# Run the first container (port 80)
docker run --network=django-ollama-service -p 80:80 --name django grant_app

# Run the second container (port 11434)
docker run --network=django-ollama-service -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Exec into container and download models
docker exec -it ollama bash
ollama pull all-minilm
ollama pull gemma:2b

# To stop all containers
docker stop $(docker ps -a -q)

in the myapi folder run:
ollama serve & ollama run gemma:2b