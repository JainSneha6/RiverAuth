import React, { useState } from 'react';
import {
  IonApp,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonToast,
  IonDatetime,
} from '@ionic/react';
import { mailOutline, callOutline, eyeOutline, eyeOffOutline, shieldCheckmarkOutline, personOutline, cardOutline, homeOutline, briefcaseOutline } from 'ionicons/icons';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  aadharNumber: string;
  panNumber: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  occupation: string;
  annualIncome: string;
  accountType: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  agreeMarketing: boolean;
};

const BankSignupPage = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    aadharNumber: '',
    panNumber: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
    occupation: '',
    annualIncome: '',
    accountType: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreeMarketing: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  ];

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    const requiredFields: (keyof FormData)[] = [
      'firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'agreeTerms',
    ];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToastMessage('Passwords do not match.');
      setShowToast(true);
      return;
    }

    if (!formData.agreeTerms) {
      setToastMessage('You must agree to the Terms & Conditions.');
      setShowToast(true);
      return;
    }

    setToastMessage('Account created successfully!');
    setShowToast(true);
    console.log('Form submitted:', formData);
  };

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
          <IonTitle className="text-white font-bold text-xl text-center">RiverAuth</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to RiverAuth</h1>
          <p className="text-gray-600 text-lg">India's Most Trusted Digital Banking Platform</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-700 mx-auto mt-3 rounded-full"></div>
        </div>

        <IonCard className="max-w-4xl mx-auto rounded-3xl shadow-2xl">
          <IonCardHeader className="bg-gradient-to-r from-blue-600 to-purple-700 text-center">
            <IonCardTitle className="text-2xl font-bold text-white mb-2">Create Your Account</IonCardTitle>
            <IonCardSubtitle className="text-blue-100">Join millions of Indians banking digitally</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <IonIcon icon={personOutline} className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonInput
                        placeholder="First Name *"
                        value={formData.firstName}
                        onIonChange={(e) => handleInputChange('firstName', e.detail.value!)}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonInput
                        placeholder="Last Name *"
                        value={formData.lastName}
                        onIonChange={(e) => handleInputChange('lastName', e.detail.value!)}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonIcon icon={mailOutline} slot="start" className="text-blue-600" />
                      <IonInput
                        type="email"
                        placeholder="Email Address *"
                        value={formData.email}
                        onIonChange={(e) => handleInputChange('email', e.detail.value!)}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonIcon icon={callOutline} slot="start" className="text-blue-600" />
                      <IonInput
                        type="tel"
                        placeholder="Mobile Number *"
                        value={formData.phone}
                        onIonChange={(e) => handleInputChange('phone', e.detail.value!)}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonLabel>Date of Birth</IonLabel>
                      <IonDatetime
                        value={formData.dateOfBirth}
                        onIonChange={(e) => handleInputChange('dateOfBirth', e.detail.value!)}
                        className="text-gray-900"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonSelect
                        value={formData.gender}
                        onIonChange={(e) => handleInputChange('gender', e.detail.value)}
                        placeholder="Select Gender"
                        className="text-gray-900"
                      >
                        <IonSelectOption value="male">Male</IonSelectOption>
                        <IonSelectOption value="female">Female</IonSelectOption>
                        <IonSelectOption value="other">Other</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>

            {/* Identity Verification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <IonIcon icon={cardOutline} className="w-5 h-5 mr-2 text-blue-600" />
                Identity Verification
              </h3>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonInput
                        placeholder="Aadhar Number"
                        value={formData.aadharNumber}
                        onIonChange={(e) => handleInputChange('aadharNumber', e.detail.value!)}
                        maxlength={12}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonInput
                        placeholder="PAN Number"
                        value={formData.panNumber}
                        onIonChange={(e) => handleInputChange('panNumber', e.detail.value!)}
                        maxlength={10}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>

            {/* Address Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <IonIcon icon={homeOutline} className="w-5 h-5 mr-2 text-blue-600" />
                Address Details
              </h3>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonInput
                        placeholder="Full Address"
                        value={formData.address}
                        onIonChange={(e) => handleInputChange('address', e.detail.value!)}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonInput
                        placeholder="City"
                        value={formData.city}
                        onIonChange={(e) => handleInputChange('city', e.detail.value!)}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonInput
                        placeholder="Pin Code"
                        value={formData.pincode}
                        onIonChange={(e) => handleInputChange('pincode', e.detail.value!)}
                        maxlength={6}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonSelect
                        value={formData.state}
                        onIonChange={(e) => handleInputChange('state', e.detail.value)}
                        placeholder="Select State"
                        className="text-gray-900"
                      >
                        {indianStates.map(state => (
                          <IonSelectOption key={state} value={state}>{state}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>

            {/* Professional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <IonIcon icon={briefcaseOutline} className="w-5 h-5 mr-2 text-blue-600" />
                Professional Details
              </h3>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonInput
                        placeholder="Occupation"
                        value={formData.occupation}
                        onIonChange={(e) => handleInputChange('occupation', e.detail.value!)}
                        className="text-gray-900 placeholder-gray-500"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem>
                      <IonSelect
                        value={formData.annualIncome}
                        onIonChange={(e) => handleInputChange('annualIncome', e.detail.value)}
                        placeholder="Annual Income"
                        className="text-gray-900"
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
              </IonGrid>
            </div>

            {/* Account Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Account Type</h3>
              <IonItem>
                <IonSelect
                  value={formData.accountType}
                  onIonChange={(e) => handleInputChange('accountType', e.detail.value)}
                  placeholder="Select Account Type"
                  className="text-gray-900"
                >
                  <IonSelectOption value="savings">Savings Account</IonSelectOption>
                  <IonSelectOption value="current">Current Account</IonSelectOption>
                  <IonSelectOption value="salary">Salary Account</IonSelectOption>
                  <IonSelectOption value="student">Student Account</IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Security</h3>
              <IonItem>
                <IonInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create Password *"
                  value={formData.password}
                  onIonChange={(e) => handleInputChange('password', e.detail.value!)}
                  className="text-gray-900 placeholder-gray-500"
                />
                <IonButton slot="end" fill="clear" onClick={() => setShowPassword(!showPassword)}>
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} className="text-blue-600" />
                </IonButton>
              </IonItem>
              <IonItem>
                <IonInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onIonChange={(e) => handleInputChange('confirmPassword', e.detail.value!)}
                  className="text-gray-900 placeholder-gray-500"
                />
                <IonButton slot="end" fill="clear" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} className="text-blue-600" />
                </IonButton>
              </IonItem>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <IonItem lines="none" className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                <IonCheckbox
                  slot="start"
                  checked={formData.agreeTerms}
                  onIonChange={(e) => handleInputChange('agreeTerms', e.detail.checked!)}
                />
                <IonLabel className="text-sm text-gray-700 leading-relaxed">
                  I agree to the <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Terms & Conditions</span> and <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span> of RiverAuth Digital Bank *
                </IonLabel>
              </IonItem>
              <IonItem lines="none" className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <IonCheckbox
                  slot="start"
                  checked={formData.agreeMarketing}
                  onIonChange={(e) => handleInputChange('agreeMarketing', e.detail.checked!)}
                />
                <IonLabel className="text-sm text-gray-600 leading-relaxed">
                  I would like to receive updates about new products, offers, and services from RiverAuth
                </IonLabel>
              </IonItem>
            </div>

            {/* Submit Button */}
            <IonButton
              expand="block"
              className="h-14 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={handleSubmit}
            >
              Create My RiverAuth Account
            </IonButton>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account? <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Sign In</span>
              </p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 pt-4 text-green-600">
              <IonIcon icon={shieldCheckmarkOutline} className="w-5 h-5" />
              <span className="text-sm font-medium">256-bit SSL Encrypted & RBI Approved</span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-xs text-gray-500 leading-relaxed">
            RiverAuth is regulated by the Reserve Bank of India (RBI)<br />
            Member of Deposit Insurance and Credit Guarantee Corporation (DICGC)
          </p>
        </div>
      </IonContent>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        buttons={[
          {
            text: 'Close',
            role: 'cancel',
            handler: () => setShowToast(false)
          }
        ]}
      />
    </IonApp>
  );
};

export default BankSignupPage;