# Helm Chart for microservice-example_

This Helm chart is used to deploy the `hls-microservice-backend` application on Kubernetes. Helm is a package manager for Kubernetes that helps in defining, installing, and upgrading applications. 

## Introduction to Helm

Helm is a powerful tool that streamlines the deployment and management of applications on Kubernetes. It uses a packaging format called charts, which are collections of files that describe a related set of Kubernetes resources.

### Why Use Helm?

1. **Simplified Deployment:** Helm charts allow you to deploy complex applications with a single command.
2. **Versioning:** Helm keeps track of versioned releases, making it easy to roll back to previous versions if needed.
3. **Configuration Management:** Helm enables you to manage your application configurations in a structured way, using `values.yaml` files.
4. **Reusability:** Helm charts can be shared and reused across different projects and teams.

## Prerequisites

Before deploying the `hls-microservice-backend` application, ensure you have the following prerequisites:

1. **Kubernetes Cluster:** You need a running Kubernetes cluster. You can use services like Minikube for local development or managed Kubernetes services like GKE, EKS, or AKS for production. For more information on setting up a Kubernetes cluster, refer to the official [Kubernetes documentation](https://kubernetes.io/docs/setup/).

2. **kubectl:** The Kubernetes command-line tool, `kubectl`, should be installed and configured to communicate with your cluster. You can follow the installation guide [here](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

3. **Helm:** Helm should be installed on your local machine. You can follow the official [Helm installation guide](https://helm.sh/docs/intro/install/) for detailed instructions.

4. **Docker:** Docker should be installed and running on your local machine to build the Docker images for the services. You can download and install Docker from the [official Docker website](https://www.docker.com/get-started).

5. **Node.js and npm:** Ensure that Node.js and npm are installed on your local machine. You can download them from the [official Node.js website](https://nodejs.org/).

## Preparing the Helm Chart

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/yourusername/microservice-example_
   cd microservice-example_/charts/microservice-example-chart/
   ```

2. **Understand the Chart Structure:**
   - `Chart.yaml`: Contains metadata about the chart.
   - `values.yaml`: Default configuration values for the chart.
   - `templates/`: Directory containing Kubernetes manifest templates that will be rendered using the values from `values.yaml`.

## Customizing the values.yaml File

Before deploying the chart, you need to customize the `values.yaml` file to fit your environment. Key configurations include:

1. **MongoDB URI:**
   ```yaml
   mongodb:
     uri: "your-mongodb-uri" # INPUT_REQUIRED {Replace with your MongoDB URI}
   ```

2. **RabbitMQ URL and Queue:**
   ```yaml
   rabbitmq:
     url: "your-rabbitmq-url" # INPUT_REQUIRED {Replace with your RabbitMQ URL}
     queue: "your-rabbitmq-queue-name" # INPUT_REQUIRED {Replace with your RabbitMQ queue name}
   ```

For more details on configuration options, refer to the comments within the `values.yaml` file.

## Packaging the Helm Chart

To package the Helm chart, run:
```sh
helm package .
```
This command will create a `.tgz` file that can be used to deploy the chart.

## Deploying the Helm Chart

To deploy the chart, use the `helm install` command:
```sh
helm install my-release-name ./microservice-example-chart
```

Replace `my-release-name` with a name for your release. This command will deploy the `microservice-example_` application to your Kubernetes cluster.

## Verifying the Deployment

To verify the deployment, you can check the status of the Helm release:
```sh
helm status my-release-name
```

You can also use `kubectl` to check the status of the pods and services:
```sh
kubectl get pods
kubectl get services
```

## Updating the Helm Release

If you need to make changes to the `values.yaml` file or the chart itself, you can update the Helm release using:
```sh
helm upgrade my-release-name ./microservice-example-chart
```

## Rolling Back a Helm Release

In case you need to roll back to a previous release, use the `helm rollback` command:
```sh
helm rollback my-release-name <revision>
```

Replace `<revision>` with the revision number you want to roll back to.

## Troubleshooting

If you encounter any issues during deployment or management, here are some common troubleshooting steps:

1. **Check Helm Logs:**
   ```sh
   helm get all my-release-name
   ```

2. **Check Pod Logs:**
   ```sh
   kubectl logs <pod-name>
   ```

3. **Verify Configuration:**
   Ensure that the values in the `values.yaml` file are correctly set.

For more detailed troubleshooting, refer to the [Helm Troubleshooting Guide](https://helm.sh/docs/chart_template_guide/debugging/).

## Conclusion

This guide provides an extensive overview of deploying the `microservice-example_` application using Helm. For any further questions or issues, please refer to the official [Helm documentation](https://helm.sh/docs/) or the [Kubernetes documentation](https://kubernetes.io/docs/).