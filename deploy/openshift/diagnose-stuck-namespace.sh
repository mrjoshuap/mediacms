#!/bin/bash
# Script to diagnose why a namespace is stuck terminating
# Usage: ./diagnose-stuck-namespace.sh <namespace>

NAMESPACE="${1:-mediacms}"

echo "=== Diagnosing stuck namespace: $NAMESPACE ==="
echo ""

# Check namespace status
echo "1. Namespace status:"
oc get namespace $NAMESPACE -o yaml | grep -A 5 "status:"
echo ""

# Check for remaining resources
echo "2. All remaining resources in namespace:"
oc api-resources --verbs=list --namespaced -o name | xargs -n 1 oc get --show-kind --ignore-not-found -n $NAMESPACE 2>/dev/null | grep -v "^$" || echo "No resources found"
echo ""

# Check PVCs specifically
echo "3. PersistentVolumeClaims:"
oc get pvc -n $NAMESPACE
echo ""

# Check PVs that might be bound to PVCs
echo "4. PersistentVolumes (checking for bound PVs):"
oc get pv | grep -E "NAME|$NAMESPACE" || echo "No PVs found matching namespace"
echo ""

# Check for finalizers on PVCs
echo "5. PVC finalizers:"
for pvc in $(oc get pvc -n $NAMESPACE -o name 2>/dev/null); do
  echo "Checking $pvc:"
  oc get $pvc -n $NAMESPACE -o jsonpath='{.metadata.finalizers}' 2>/dev/null || echo "  No finalizers"
  echo ""
done

# Check for finalizers on PVs
echo "6. PV finalizers (for PVs bound to this namespace):"
for pv in $(oc get pv -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null); do
  claimRef=$(oc get pv $pv -o jsonpath='{.spec.claimRef.namespace}' 2>/dev/null)
  if [ "$claimRef" == "$NAMESPACE" ]; then
    echo "PV $pv (bound to $NAMESPACE):"
    oc get pv $pv -o jsonpath='{.metadata.finalizers}' 2>/dev/null || echo "  No finalizers"
    echo "  Status: $(oc get pv $pv -o jsonpath='{.status.phase}')"
    echo ""
  fi
done

# Check for finalizers on namespace itself
echo "7. Namespace finalizers:"
oc get namespace $NAMESPACE -o jsonpath='{.metadata.finalizers}' 2>/dev/null
echo ""
echo ""

# Check for stuck pods
echo "8. Pods (including terminating):"
oc get pods -n $NAMESPACE --show-labels 2>/dev/null || echo "No pods found"
echo ""

# Check for stuck deployments/statefulsets
echo "9. Deployments and StatefulSets:"
oc get deployments,statefulsets -n $NAMESPACE 2>/dev/null || echo "No deployments/statefulsets found"
echo ""

echo "=== Diagnosis complete ==="
echo ""
echo "Common solutions:"
echo "1. If PVCs have finalizers, remove them:"
echo "   oc patch pvc <pvc-name> -n $NAMESPACE -p '{\"metadata\":{\"finalizers\":[]}}' --type=merge"
echo ""
echo "2. If PVs have finalizers, remove them:"
echo "   oc patch pv <pv-name> -p '{\"metadata\":{\"finalizers\":[]}}' --type=merge"
echo ""
echo "3. If namespace has finalizers, remove them:"
echo "   oc patch namespace $NAMESPACE -p '{\"metadata\":{\"finalizers\":[]}}' --type=merge"
echo ""
echo "4. Force delete PVCs (if safe to do so):"
echo "   oc delete pvc --all -n $NAMESPACE --force --grace-period=0"
echo ""
