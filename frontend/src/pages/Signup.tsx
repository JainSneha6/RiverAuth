import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonBackButton,
  IonButtons
} from '@ionic/react';
import { 
  personOutline, 
  mailOutline, 
  callOutline, 
  locationOutline, 
  cardOutline,
  lockClosedOutline,
  businessOutline,
  chevronBackOutline
} from 'ionicons/icons';

const BankSignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    aadhar: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    occupation: '',
    income: '',
    accountType: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState<any>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    if (!formData.aadhar.trim()) {
      newErrors.aadhar = 'Aadhar number is required';
    } else if (!/^\d{12}$/.test(formData.aadhar)) {
      newErrors.aadhar = 'Aadhar number must be 12 digits';
    }
    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      newErrors.pan = 'Invalid PAN format';
    }
    if (!formData.accountType) newErrors.accountType = 'Account type is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Form submitted:', formData);
      alert('Account registration successful! You will receive a confirmation email shortly.');
    }
  };

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" icon={chevronBackOutline} />
          </IonButtons>
          <IonTitle style={{ color: 'white', fontWeight: 'bold' }}>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div style={{ 
          minHeight: '100vh',
          padding: '20px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <IonCard style={{ 
            marginTop: '10px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <IonCardHeader style={{ textAlign: 'center', paddingBottom: '10px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
              }}>
                <IonIcon icon={businessOutline} style={{ fontSize: '36px', color: 'white' }} />
              </div>
              <IonCardTitle style={{ 
                color: '#2c3e50',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Open Your Bank Account
              </IonCardTitle>
              <IonText style={{ color: '#7f8c8d', fontSize: '14px' }}>
                Join millions of Indians banking with trust and security
              </IonText>
            </IonCardHeader>

            <IonCardContent>
              <IonGrid>
                {/* Personal Information */}
                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: '#2c3e50', marginBottom: '16px', fontSize: '18px' }}>
                      Personal Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={personOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">First Name *</IonLabel>
                      <IonInput
                        value={formData.firstName}
                        onIonInput={(e) => handleInputChange('firstName', e.detail.value!)}
                        placeholder="Enter your first name"
                      />
                    </IonItem>
                    {errors.firstName && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.firstName}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={personOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">Last Name *</IonLabel>
                      <IonInput
                        value={formData.lastName}
                        onIonInput={(e) => handleInputChange('lastName', e.detail.value!)}
                        placeholder="Enter your last name"
                      />
                    </IonItem>
                    {errors.lastName && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.lastName}</IonText>}
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={mailOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">Email Address *</IonLabel>
                      <IonInput
                        type="email"
                        value={formData.email}
                        onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                        placeholder="your.email@example.com"
                      />
                    </IonItem>
                    {errors.email && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.email}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={callOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">Mobile Number *</IonLabel>
                      <IonInput
                        type="tel"
                        value={formData.phone}
                        onIonInput={(e) => handleInputChange('phone', e.detail.value!)}
                        placeholder="10-digit mobile number"
                      />
                    </IonItem>
                    {errors.phone && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.phone}</IonText>}
                  </IonCol>
                </IonRow>

                {/* Document Information */}
                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: '#2c3e50', marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>
                      Document Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">Aadhar Number *</IonLabel>
                      <IonInput
                        value={formData.aadhar}
                        onIonInput={(e) => handleInputChange('aadhar', e.detail.value!)}
                        placeholder="12-digit Aadhar number"
                        maxlength={12}
                      />
                    </IonItem>
                    {errors.aadhar && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.aadhar}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">PAN Number *</IonLabel>
                      <IonInput
                        value={formData.pan}
                        onIonInput={(e) => handleInputChange('pan', e.detail.value!)}
                        placeholder="ABCDE1234F"
                        style={{ textTransform: 'uppercase' }}
                        maxlength={10}
                      />
                    </IonItem>
                    {errors.pan && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.pan}</IonText>}
                  </IonCol>
                </IonRow>

                {/* Address Information */}
                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: '#2c3e50', marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>
                      Address Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">Complete Address</IonLabel>
                      <IonInput
                        value={formData.address}
                        onIonInput={(e) => handleInputChange('address', e.detail.value!)}
                        placeholder="House number, street, area"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonLabel position="stacked">City</IonLabel>
                      <IonInput
                        value={formData.city}
                        onIonInput={(e) => handleInputChange('city', e.detail.value!)}
                        placeholder="Your city"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonLabel position="stacked">State</IonLabel>
                      <IonSelect
                        value={formData.state}
                        onIonChange={(e) => handleInputChange('state', e.detail.value)}
                        placeholder="Select State"
                      >
                        {states.map(state => (
                          <IonSelectOption key={state} value={state}>{state}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonLabel position="stacked">PIN Code</IonLabel>
                      <IonInput
                        value={formData.pincode}
                        onIonInput={(e) => handleInputChange('pincode', e.detail.value!)}
                        placeholder="6-digit PIN"
                        maxlength={6}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>

                {/* Professional Information */}
                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: '#2c3e50', marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>
                      Professional Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonLabel position="stacked">Occupation</IonLabel>
                      <IonSelect
                        value={formData.occupation}
                        onIonChange={(e) => handleInputChange('occupation', e.detail.value)}
                        placeholder="Select Occupation"
                      >
                        <IonSelectOption value="salaried">Salaried Employee</IonSelectOption>
                        <IonSelectOption value="business">Business Owner</IonSelectOption>
                        <IonSelectOption value="freelancer">Freelancer</IonSelectOption>
                        <IonSelectOption value="retired">Retired</IonSelectOption>
                        <IonSelectOption value="student">Student</IonSelectOption>
                        <IonSelectOption value="others">Others</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonLabel position="stacked">Annual Income</IonLabel>
                      <IonSelect
                        value={formData.income}
                        onIonChange={(e) => handleInputChange('income', e.detail.value)}
                        placeholder="Select Income Range"
                      >
                        <IonSelectOption value="below-2">Below ₹2 Lakhs</IonSelectOption>
                        <IonSelectOption value="2-5">₹2-5 Lakhs</IonSelectOption>
                        <IonSelectOption value="5-10">₹5-10 Lakhs</IonSelectOption>
                        <IonSelectOption value="10-25">₹10-25 Lakhs</IonSelectOption>
                        <IonSelectOption value="above-25">Above ₹25 Lakhs</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                </IonRow>

                {/* Account Information */}
                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: '#2c3e50', marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>
                      Account Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonLabel position="stacked">Account Type *</IonLabel>
                      <IonSelect
                        value={formData.accountType}
                        onIonChange={(e) => handleInputChange('accountType', e.detail.value)}
                        placeholder="Select Account Type"
                      >
                        <IonSelectOption value="savings">Savings Account</IonSelectOption>
                        <IonSelectOption value="current">Current Account</IonSelectOption>
                        <IonSelectOption value="salary">Salary Account</IonSelectOption>
                        <IonSelectOption value="fd">Fixed Deposit Account</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                    {errors.accountType && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.accountType}</IonText>}
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={lockClosedOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">Password *</IonLabel>
                      <IonInput
                        type="password"
                        value={formData.password}
                        onIonInput={(e) => handleInputChange('password', e.detail.value!)}
                        placeholder="Minimum 8 characters"
                      />
                    </IonItem>
                    {errors.password && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.password}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={lockClosedOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked">Confirm Password *</IonLabel>
                      <IonInput
                        type="password"
                        value={formData.confirmPassword}
                        onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value!)}
                        placeholder="Re-enter password"
                      />
                    </IonItem>
                    {errors.confirmPassword && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.confirmPassword}</IonText>}
                  </IonCol>
                </IonRow>

                {/* Terms and Conditions */}
                <IonRow>
                  <IonCol size="12">
                    <IonItem style={{ '--background': 'transparent', '--border-radius': '12px', marginTop: '16px' }}>
                      <IonCheckbox
                        checked={formData.agreeTerms}
                        onIonChange={(e) => handleInputChange('agreeTerms', e.detail.checked)}
                        slot="start"
                        style={{ '--color': '#667eea' }}
                      />
                      <IonLabel style={{ marginLeft: '12px', fontSize: '14px' }}>
                        I agree to the{' '}
                        <span style={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}>
                          Terms and Conditions
                        </span>{' '}
                        and{' '}
                        <span style={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}>
                          Privacy Policy
                        </span>
                      </IonLabel>
                    </IonItem>
                    {errors.agreeTerms && (
                      <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>
                        {errors.agreeTerms}
                      </IonText>
                    )}
                  </IonCol>
                </IonRow>

                {/* Submit Button */}
                <IonRow>
                  <IonCol size="12">
                    <IonButton
                      expand="block"
                      size="large"
                      onClick={handleSubmit}
                      style={{
                        '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '--color': 'white',
                        '--border-radius': '12px',
                        height: '50px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginTop: '24px',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      Create My Account
                    </IonButton>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" style={{ textAlign: 'center', marginTop: '16px' }}>
                    <IonText style={{ fontSize: '14px', color: '#7f8c8d' }}>
                      Already have an account?{' '}
                      <span style={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}>
                        Sign In
                      </span>
                    </IonText>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Security Notice */}
          <IonCard style={{ 
            marginTop: '16px',
            marginBottom: '20px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <IonCardContent style={{ padding: '16px', textAlign: 'center' }}>
              <IonText style={{ fontSize: '12px', color: '#7f8c8d', lineHeight: '1.5' }}>
                🔒 Your information is secure and encrypted. We follow RBI guidelines and use bank-grade security to protect your data.
              </IonText>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BankSignupPage;