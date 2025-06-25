import React from 'react';
import { IonItem, IonLabel, IonInput, IonIcon, IonCol, IonRow, IonSelect, IonSelectOption } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';

interface FormData {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Errors {
  [key: string]: string;
}

interface AddressInfoProps {
  formData: FormData;
  errors: Errors;
  handleInputChange: (field: string) => (e: CustomEvent) => void;
  handleInputBlur: (field: string) => () => void;
}

const AddressInfoSection: React.FC<AddressInfoProps> = ({ formData, errors, handleInputChange, handleInputBlur }) => {
  const labelStyle = { color: 'black' };
  const inputStyle = { color: 'black', '--placeholder-color': 'black' };
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Puducherry',
  ];

  return (
    <>
      <IonRow>
        <IonCol size="12">
          <h3 style={{ color: 'black', marginBottom: '16px', fontSize: '18px' }}>Address Information</h3>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Address</IonLabel>
            <IonInput value={formData.address} onIonInput={handleInputChange('address')} onIonBlur={handleInputBlur('address')} placeholder="Enter your address" style={inputStyle} />
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12" sizeMd="4">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>City</IonLabel>
            <IonInput value={formData.city} onIonInput={handleInputChange('city')} onIonBlur={handleInputBlur('city')} placeholder="Enter your city" style={inputStyle} />
          </IonItem>
        </IonCol>
        <IonCol size="12" sizeMd="4">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>State</IonLabel>
            <IonSelect value={formData.state} onIonChange={handleInputChange('state')} placeholder="Select your state" style={inputStyle}>
              {states.map(state => <IonSelectOption key={state} value={state}>{state}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
        </IonCol>
        <IonCol size="12" sizeMd="4">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Pincode</IonLabel>
            <IonInput value={formData.pincode} onIonInput={handleInputChange('pincode')} onIonBlur={handleInputBlur('pincode')} placeholder="Enter your pincode" style={inputStyle} />
          </IonItem>
        </IonCol>
      </IonRow>
    </>
  );
};

export default AddressInfoSection;