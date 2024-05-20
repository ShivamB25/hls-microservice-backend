This guide provides an in-depth explanation of how Kubernetes is used in this project, including how to deploy the application using Kubernetes and Helm.

## Table of Contents

1. [Introduction to Kubernetes](#introduction-to-kubernetes)
2. [Setting Up a Kubernetes Cluster](#setting-up-a-kubernetes-cluster)
3. [Using kubectl](#using-kubectl)
4. [Helm Chart Deployment](#helm-chart-deployment)
5. [Purpose of Each YAML File](#purpose-of-each-yaml-file)

## Introduction to Kubernetes

Kubernetes is an open-source platform designed to automate deploying, scaling, and operating application containers. It groups containers that make up an application into logical units for easy management and discovery.

## Setting Up a Kubernetes Cluster

To deploy the `microservice-example_` application, you need a running Kubernetes cluster. You can use Minikube for local development or managed Kubernetes services like GKE, EKS, or AKS for production.

### Prerequisites

1. **kubectl:** The Kubernetes command-line tool should be installed and configured to communicate with your cluster. [Install kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
2. **Helm:** Helm should be installed on your local machine. [Install Helm](https://helm.sh/docs/intro/install/)
3. **Docker:** Docker should be installed and running on your local machine. [Get Docker](https://www.docker.com/get-started)

### Steps to Set Up a Kubernetes Cluster

1. **Minikube (Local Development):**
   ```sh
   minikube start
   ```

2. **Managed Kubernetes Services:**
   Follow the respective documentation for GKE, EKS, or AKS to create a cluster.

## Using kubectl

`kubectl` is the command-line tool for interacting with Kubernetes clusters. Below are some basic commands to get started:

- **Get cluster information:**
  ```sh
  kubectl cluster-info
  ```

- **List all nodes in the cluster:**
  ```sh
  kubectl get nodes
  ```

- **Get the status of all pods:**
  ```sh
  kubectl get pods
  ```

- **Describe a specific pod:**
  ```sh
  kubectl describe pod <pod-name>
  ```

## Helm Chart Deployment

### Packaging the Helm Chart

To package the Helm chart, navigate to the `charts/microservice-example-chart/` directory and run:
```sh
helm package .
```
This command will create a `.tgz` file that can be used to deploy the chart.

### Deploying the Helm Chart

To deploy the chart, use the `helm install` command:
```sh
helm install my-release-name ./microservice-example-chart
```
Replace `my-release-name` with a name for your release. This command will deploy the `microservice-example_` application to your Kubernetes cluster.

### Verifying the Deployment

To verify the deployment, check the status of the Helm release:
```sh
helm status my-release-name
```

You can also use `kubectl` to check the status of the pods and services:
```sh
kubectl get pods
kubectl get services
```

## Purpose of Each YAML File

### `Chart.yaml`

Defines metadata for a Helm chart, including the API version, name, description, type, version, and application version.

### `values.yaml`

Contains configuration values for the chart, including the number of replicas, image details, service configurations, ingress settings, resource allocations, and MongoDB and RabbitMQ connection details.

### `templates/deployment.yaml`

Defines a Kubernetes Deployment for the main service, specifying the number of replicas, container image, environment variables, and ports.

### `templates/service.yaml`

Defines a Kubernetes Service for the main service, specifying the service type and ports configuration.

### `templates/video-processing-deployment.yaml`

Defines a Kubernetes Deployment for the video processing service, specifying the number of replicas, container image, environment variables, and ports.

### `templates/video-processing-service.yaml`

Defines a Kubernetes Service for the video processing service, specifying the service type and ports.

### `templates/configmap.yaml`

Defines a Kubernetes ConfigMap with key-value pairs for MongoDB URI, RabbitMQ URL, and RabbitMQ Queue.

## Conclusion

This guide provides a comprehensive overview of deploying the `microservice-example_` application on Kubernetes using Helm. For further assistance, refer to the official [Kubernetes documentation](https://kubernetes.io/docs/) and [Helm documentation](https://helm.sh/docs/).