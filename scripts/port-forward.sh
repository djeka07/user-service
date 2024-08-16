kubectl port-forward service/pgadmin 30061:80 &
kubectl port-forward --namespace k8rabbit svc/my-rabbitmq 5672:5672 &