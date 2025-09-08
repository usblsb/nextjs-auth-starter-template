/**
 * API para crear suscripción desde PaymentIntent exitoso
 * Se llama después de que Payment Element complete el pago exitosamente
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { syncSubscriptionToDB, logBillingActivity } from '@/lib/services/billingService';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 API: create-subscription-from-payment iniciado');
    
    // 1. Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No userId encontrado');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Usuario autenticado:', userId);

    // 2. Parsear datos del request
    const { paymentIntentId, priceId, billingAddress, customerName } = await req.json();
    
    console.log('📦 Datos recibidos:', { 
      paymentIntentId, 
      priceId, 
      hasBillingAddress: !!billingAddress,
      hasCustomerName: !!customerName
    });

    if (!paymentIntentId || !priceId) {
      return NextResponse.json(
        { error: 'Payment Intent ID and Price ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔗 Creating subscription from payment for user ${userId}:`, {
      paymentIntentId,
      priceId,
    });

    // 3. Verificar PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // 4. Verificar que el usuario coincide
    if (paymentIntent.metadata?.clerk_user_id !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // 5. Preparar datos para la suscripción
    const paymentMethodId = paymentIntent.payment_method as string;
    const customerId = paymentIntent.customer as string;

    console.log('🔗 Using payment method for subscription:', {
      paymentMethodId,
      customerId,
      setup_future_usage: 'Payment method should be automatically attached due to setup_future_usage'
    });

    // 5.5. Actualizar customer con el nombre si está disponible
    if (customerName && customerId) {
      const customerNameString = [customerName.firstName, customerName.lastName]
        .filter(Boolean)
        .join(' ') || undefined;
      
      if (customerNameString) {
        console.log('👤 Actualizando customer con nombre:', customerNameString);
        
        await stripe.customers.update(customerId, {
          name: customerNameString,
          metadata: {
            ...paymentIntent.metadata,
            first_name: customerName.firstName || '',
            last_name: customerName.lastName || '',
          }
        });
        
        console.log('✅ Customer actualizado con nombre:', customerNameString);
      }
    }

    // 6. Crear suscripción usando el payment method (ya attached debido a setup_future_usage)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: {
        clerk_user_id: userId,
        payment_intent_id: paymentIntentId,
        created_via: 'payment_element_integration',
      },
      expand: ['latest_invoice.payment_intent', 'items.data.price'],
    });

    console.log('✅ Subscription created from payment:', subscription.id);
    console.log('📊 Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      created: subscription.created,
      items: subscription.items.data.length
    });

    // 7. Sincronizar suscripción con BD
    const syncResult = await syncSubscriptionToDB(subscription, userId);

    if (!syncResult.success) {
      console.error('⚠️ Subscription created but failed to sync to DB:', syncResult.error);
    }

    // 7.5. Guardar dirección de facturación con nombre/apellido (compliance España)
    if (billingAddress) {
      console.log('💳 Guardando dirección de facturación:', billingAddress);
      const { upsertBillingAddress } = await import('@/lib/services/billingService');
      
      // Usar el nombre del formulario (preferencia) o extraer del PaymentIntent como fallback
      let firstName = customerName?.firstName;
      let lastName = customerName?.lastName;
      
      // Fallback: extraer nombre del PaymentIntent si no viene del formulario
      if (!firstName && !lastName) {
        const billingDetails = paymentIntent.shipping?.name || paymentIntent.charges?.data?.[0]?.billing_details?.name;
        
        if (billingDetails) {
          const nameParts = billingDetails.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ') || undefined;
        }
      }
      
      const addressWithName = {
        ...billingAddress,
        firstName,
        lastName
      };
      
      console.log('👤 Guardando dirección con nombre:', { firstName, lastName });
      
      const addressResult = await upsertBillingAddress(userId, addressWithName);
      if (!addressResult.success) {
        console.error('⚠️ Failed to save billing address:', addressResult.error);
      } else {
        console.log('✅ Billing address with name saved successfully');
      }
    } else {
      console.warn('⚠️ No billing address provided');
    }

    // 8. Log de actividad
    await logBillingActivity(userId, 'SUBSCRIPTION_CREATED_FROM_PAYMENT', {
      subscriptionId: subscription.id,
      paymentIntentId,
      priceId,
      customerId: subscription.customer,
      status: subscription.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    }, 'Subscription created from successful Payment Element payment');

    // 9. Respuesta exitosa
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
      message: 'Subscription created successfully from payment',
    });

  } catch (error) {
    console.error('❌ Error creating subscription from payment:');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : 'Failed to create subscription from payment'
      },
      { status: 500 }
    );
  }
}