#!/bin/bash
# Script to fix a stuck namespace by removing blocking resources
# Usage: ./fix-stuck-namespace.sh <namespace>

NAMESPACE="${1:-mediacms}"

echo "=== Fixing stuck namespace: $NAMESPACE ==="
echo ""

# Step 1: Check and delete ArgoCD Application
echo "1. Checking for ArgoCD Application..."
if oc get applications.argoproj.io mediacms -n openshift-gitops &>/dev/null; then
  echo "   Found ArgoCD Application 'mediacms' in openshift-gitops namespace"
  echo "   Checking finalizers..."
  finalizers=$(oc get applications.argoproj.io mediacms -n openshift-gitops -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null)
  if [ -n "$finalizers" ]; then
    echo "   Finalizers found: $finalizers"
    echo "   Attempting to delete ArgoCD Application..."
    oc delete applications.argoproj.io mediacms -n openshift-gitops --wait=false 2>/dev/null || true
    sleep 2
    # If still exists, remove finalizer
    if oc get applications.argoproj.io mediacms -n openshift-gitops &>/dev/null; then
      echo "   Application still exists, removing finalizers..."
      oc patch applications.argoproj.io mediacms -n openshift-gitops -p '{"metadata":{"finalizers":[]}}' --type=merge
      echo "   Finalizers removed. Deleting application..."
      oc delete applications.argoproj.io mediacms -n openshift-gitops --wait=false
    fi
  else
    echo "   No finalizers found, deleting..."
    oc delete applications.argoproj.io mediacms -n openshift-gitops --wait=false
  fi
else
  echo "   No ArgoCD Application found"
fi
echo ""

# Step 2: Check and delete PVCs
echo "2. Checking for PersistentVolumeClaims..."
pvc_count=$(oc get pvc -n $NAMESPACE --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$pvc_count" -gt 0 ]; then
  echo "   Found $pvc_count PVC(s). Listing:"
  oc get pvc -n $NAMESPACE
  echo "   Deleting PVCs..."
  oc delete pvc --all -n $NAMESPACE --force --grace-period=0 2>/dev/null || true
  # Remove finalizers if deletion is stuck
  for pvc in $(oc get pvc -n $NAMESPACE -o name 2>/dev/null); do
    echo "   Removing finalizers from $pvc..."
    oc patch $pvc -n $NAMESPACE -p '{"metadata":{"finalizers":[]}}' --type=merge 2>/dev/null || true
  done
else
  echo "   No PVCs found"
fi
echo ""

# Step 3: Check for bound PVs
echo "3. Checking for PersistentVolumes bound to this namespace..."
pv_list=$(oc get pv -o json 2>/dev/null | jq -r ".items[] | select(.spec.claimRef.namespace==\"$NAMESPACE\") | .metadata.name" 2>/dev/null)
if [ -n "$pv_list" ]; then
  echo "   Found bound PVs:"
  echo "$pv_list" | while read pv; do
    echo "   - $pv"
    finalizers=$(oc get pv $pv -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null)
    if [ -n "$finalizers" ]; then
      echo "     Has finalizers: $finalizers"
      echo "     Removing finalizers..."
      oc patch pv $pv -p '{"metadata":{"finalizers":[]}}' --type=merge 2>/dev/null || true
    fi
  done
else
  echo "   No bound PVs found"
fi
echo ""

# Step 4: Force delete all remaining resources
echo "4. Force deleting all remaining resources in namespace..."
oc delete all --all -n $NAMESPACE --force --grace-period=0 2>/dev/null || true
oc delete configmap,secret --all -n $NAMESPACE --force --grace-period=0 2>/dev/null || true
oc delete routes --all -n $NAMESPACE --force --grace-period=0 2>/dev/null || true
oc delete buildconfigs,imagestreams --all -n $NAMESPACE --force --grace-period=0 2>/dev/null || true
echo ""

# Step 5: Remove finalizers from namespace if still stuck
echo "5. Checking namespace finalizers..."
ns_finalizers=$(oc get namespace $NAMESPACE -o jsonpath='{.metadata.finalizers[*]}' 2>/dev/null)
if [ -n "$ns_finalizers" ]; then
  echo "   Namespace still has finalizers: $ns_finalizers"
  echo "   Removing finalizers from namespace..."
  oc patch namespace $NAMESPACE -p '{"metadata":{"finalizers":[]}}' --type=merge
else
  echo "   No finalizers on namespace"
fi
echo ""

# Step 6: Final status check
echo "6. Final status check..."
sleep 2
if oc get namespace $NAMESPACE &>/dev/null; then
  phase=$(oc get namespace $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null)
  echo "   Namespace status: $phase"
  if [ "$phase" == "Terminating" ]; then
    echo ""
    echo "⚠️  Namespace is still terminating. Checking for remaining resources..."
    oc get all -n $NAMESPACE 2>/dev/null || echo "   No 'all' resources found"
    oc get pvc -n $NAMESPACE 2>/dev/null || echo "   No PVCs found"
    echo ""
    echo "   You may need to wait a bit longer, or check for custom resources."
  fi
else
  echo "   ✅ Namespace has been deleted!"
fi

echo ""
echo "=== Done ==="
