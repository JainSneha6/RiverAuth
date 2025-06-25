import React from 'react';
import { IonItem, IonLabel, IonInput, IonIcon, IonText, IonCol, IonRow } from '@ionic/react';
import { personOutline, mailOutline, callOutline, cardOutline } from 'ionicons/icons';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  aadhar: string;
  pan: string;
}

interface Errors {
  [key: string]: string;
}

interface PersonalInfoProps {
  formData: FormData;
  errors: Errors;
  handleInputChange: (field: string) => (e: CustomEvent) => void;
  handleInputBlur: (field: string) => () => void;
}

const PersonalInfoSection: React.FC<PersonalInfoProps> = ({ formData, errors, handleInputChange, handleInputBlur }) => {
  const labelStyle = { color: 'black' };
  const inputStyle = { color: 'black', '--placeholder-color': 'black' };

  return (
    <>
      <IonRow>
        <IonCol size="12">
          <h3 style={{ color: 'black', marginBottom: '16px', fontSize: '18px' }}>Personal Information</h3>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={personOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>First Name *</IonLabel>
            <IonInput value={formData.firstName} onIonInput={handleInputChange('firstName')} onIonBlur={handleInputBlur('firstName')} placeholder="Enter your first name" style={inputStyle} />
          </IonItem>
          {errors.firstName && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.firstName}</IonText>}
        </IonCol>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={personOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Last Name *</IonLabel>
            <IonInput value={formData.lastName} onIonInput={handleInputChange('lastName')} onIonBlur={handleInputBlur('lastName')} placeholder="Enter your last name" style={inputStyle} />
          </IonItem>
          {errors.lastName && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.lastName}</IonText>}
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={mailOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Email Address *</IonLabel>
            <IonInput type="email" value={formData.email} onIonInput={handleInputChange('email')} onIonBlur={handleInputBlur('email')} placeholder="Enter your email" style={inputStyle} />
          </IonItem>
          {errors.email && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.email}</IonText>}
        </IonCol>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={callOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Phone Number *</IonLabel>
            <IonInput type="tel" value={formData.phone} onIonInput={handleInputChange('phone')} onIonBlur={handleInputBlur('phone')} placeholder="Enter your phone number" style={inputStyle} />
          </IonItem>
          {errors.phone && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.phone}</IonText>}
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Aadhar Number *</IonLabel>
            <IonInput value={formData.aadhar} onIonInput={handleInputChange('aadhar')} onIonBlur={handleInputBlur('aadhar')} placeholder="Enter your Aadhar number" style={inputStyle} />
          </IonItem>
          {errors.aadhar && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.aadhar}</IonText>}
        </IonCol>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>PAN Number *</IonLabel>
            <IonInput value={formData.pan} onIonInput={handleInputChange('pan')} onIonBlur={handleInputBlur('pan')} placeholder="Enter your PAN number" style={inputStyle} />
          </IonItem>
          {errors.pan && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.pan}</IonText>}
        </IonCol>
      </IonRow>
    </>
  );
};

export default PersonalInfoSection;