1) docker build -t grant_app .
2) docker run --gpus all -p 80:80 --add-host host.docker.internal:3.14.168.197 grant_app

in the myapi folder run:
ollama serve & ollama run gemma:2b