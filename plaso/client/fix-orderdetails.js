const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/OrderDetailsScreen.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('paymentApi')) {
    content = content.replace("import { orderApi } from '../services/api/orderApi';", "import { orderApi } from '../services/api/orderApi';\nimport { paymentApi } from '../services/api/paymentApi';");
}

content = content.replace('const { orderId } = route.params;', 'const { orderId, isAdminView } = route.params;');

const handleDisputeStr = `  const handleDispute = async () => {`;
const refundStr = `
  const handleRefund = async () => {
    Alert.alert('Process Refund', 'Are you sure you want to refund this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Refund',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            const response = await paymentApi.refundOrder(orderId);
            if (response.success && response.data) {
              setOrder(prev => prev ? { ...prev, paymentStatus: PaymentStatus.REFUNDED } : null);
              Alert.alert('Refund Processed', 'The amount has been refunded.');
            }
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to refund order');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };

`;

if (!content.includes('handleRefund')) {
    content = content.replace(handleDisputeStr, refundStr + handleDisputeStr);
}

const buttonsStr = `        {canDispute && !canCancel && !canComplete && (
           <TouchableOpacity 
           style={styles.disputeBtn} 
           onPress={handleDispute}
           disabled={updating}
         >
           <Text style={styles.disputeBtnText}>Report an Issue / Dispute</Text>
         </TouchableOpacity>
        )}`;

const newButtonsStr = buttonsStr + `

        {isAdminView && order.paymentStatus === PaymentStatus.PAID && (
          <TouchableOpacity 
            style={[styles.cancelBtn, { marginTop: 12, borderColor: theme.colors.primary }]} 
            onPress={handleRefund}
            disabled={updating}
          >
            <Text style={[styles.cancelBtnText, { color: theme.colors.primary }]}>Process Refund</Text>
          </TouchableOpacity>
        )}`;

if (!content.includes('handleRefund}')) {
    content = content.replace(buttonsStr, newButtonsStr);
}

fs.writeFileSync(file, content, 'utf8');

console.log('Fixed Order Details');
