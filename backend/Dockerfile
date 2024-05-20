FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu20.04


#set up environment
RUN apt-get update && apt-get install --no-install-recommends --no-install-suggests -y curl
RUN apt-get update && apt-get install -y iputils-ping
RUN apt-get install unzip
RUN apt-get -y install python3
RUN apt-get -y install python3-pip

# Copy our application code
WORKDIR /var/app

# . Here means current directory.
COPY . .

RUN pip3 install --no-cache-dir -r requirements.txt

# Make sure the entrypoint script is executable
RUN chmod +x entrypoint.sh

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8


EXPOSE 80 11434

# Run the entrypoint script
CMD ["./entrypoint.sh"]
