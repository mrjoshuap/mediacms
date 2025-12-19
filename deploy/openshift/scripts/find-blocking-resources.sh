#!/bin/bash
# Script to find resources blocking namespace deletion
# Usage: ./find-blocking-resources.sh <namespace>

NAMESPACE="${1:-mediacms}"

echo "=== Finding resources blocking namespace deletion: $NAMESPACE ==="
echo ""

# Check namespace status
echo "1. Namespace status:"
oc get namespace $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null
echo ""
echo ""

# Get all API resources that are namespaced and check for remaining resources
echo "2. Checking all resource types for remaining resources..."
echo ""

# Common resources that often block deletion
RESOURCES=(
  "pods"
  "persistentvolumeclaims"
  "persistentvolumes"
  "deployments"
  "statefulsets"
  "replicasets"
  "services"
  "configmaps"
  "secrets"
  "routes"
  "buildconfigs"
  "imagestreams"
  "applications.argoproj.io"
  "applicationapplicationsets.argoproj.io"
)

for resource in "${RESOURCES[@]}"; do
  count=$(oc get $resource -n $NAMESPACE --no-headers 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo "⚠️  Found $count $resource:"
    oc get $resource -n $NAMESPACE 2>/dev/null
    echo ""
    
    # Check for finalizers on these resources
    for item in $(oc get $resource -n $NAMESPACE -o name 2>/dev/null); do
      finalizers=$(oc get $item -n $NAMESPACE -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null)
      if [ -n "$finalizers" ]; then
        echo "   $item has finalizers: $finalizers"
      fi
    done
    echo ""
  fi
done

# Special check for PVs (they're cluster-scoped but bound to namespace)
echo "3. Checking PersistentVolumes bound to this namespace:"
oc get pv -o json 2>/dev/null | jq -r ".items[] | select(.spec.claimRef.namespace==\"$NAMESPACE\") | \"\(.metadata.name) - Phase: \(.status.phase) - Finalizers: \(.metadata.finalizers // [])\"" || echo "No matching PVs found"
echo ""

# Check for stuck pods
echo "4. Checking for stuck/terminating pods:"
oc get pods -n $NAMESPACE 2>/dev/null | grep -E "Terminating|Pending|Error" || echo "No stuck pods found"
echo ""

# Check for resources with finalizers across all types
echo "5. All resources with finalizers in namespace:"
for resource in $(oc api-resources --verbs=list --namespaced -o name 2>/dev/null); do
  for item in $(oc get $resource -n $NAMESPACE -o name 2>/dev/null); do
    finalizers=$(oc get $item -n $NAMESPACE -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null)
    if [ -n "$finalizers" ]; then
      echo "  $item: $finalizers"
    fi
  done
done
echo ""

# Check ArgoCD Application if it exists
echo "6. Checking for ArgoCD Application (this often blocks deletion):"
oc get applications.argoproj.io -n openshift-gitops 2>/dev/null | grep $NAMESPACE || echo "No ArgoCD Application found"
if oc get applications.argoproj.io -n openshift-gitops 2>/dev/null | grep -q $NAMESPACE; then
  app_name=$(oc get applications.argoproj.io -n openshift-gitops -o name 2>/dev/null | grep -i mediacms | head -1)
  if [ -n "$app_name" ]; then
    echo "  Found: $app_name"
    oc get $app_name -n openshift-gitops -o jsonpath='{.metadata.finalizers}' 2>/dev/null
    echo ""
  fi
fi
echo ""

echo "=== Summary ==="
echo ""
echo "If resources are found above, try:"
echo ""
echo "1. Delete PVCs (if safe):"
echo "   oc delete pvc --all -n $NAMESPACE --force --grace-period=0"
echo ""
echo "2. Remove finalizers from specific resources:"
echo "   oc patch <resource-type> <resource-name> -n $NAMESPACE -p '{\"metadata\":{\"finalizers\":[]}}' --type=merge"
echo ""
echo "3. Force delete all resources in namespace:"
echo "   oc delete all --all -n $NAMESPACE --force --grace-period=0"
echo ""
echo "4. If ArgoCD Application exists, delete it:"
echo "   oc delete applications.argoproj.io <app-name> -n openshift-gitops --force --grace-period=0"
echo ""
