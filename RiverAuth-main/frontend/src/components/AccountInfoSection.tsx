import React from 'react';
import { IonItem, IonLabel, IonInput, IonIcon, IonText, IonCol, IonRow, IonSelect, IonSelectOption, IonCheckbox } from '@ionic/react';
import { businessOutline, cardOutline, lockClosedOutline } from 'ionicons/icons';

interface FormData {
  occupation: string;
  income: string;
  accountType: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface Errors {
  [key: string]: string;
}

interface AccountInfoProps {
  formData: FormData;
  errors: Errors;
  handleInputChange: (field: string) => (e: CustomEvent) => void;
  handleInputBlur: (field: string) => () => void;
  handleCheckboxChange: (field: string, value: boolean) => void;
}

const AccountInfoSection: React.FC<AccountInfoProps> = ({ formData, errors, handleInputChange, handleInputBlur, handleCheckboxChange }) => {
  const labelStyle = { color: 'black' };
  const inputStyle = { color: 'black', '--placeholder-color': 'black' };

  return (
    <>
      <IonRow>
        <IonCol size="12">
          <h3 style={{ color: 'black', marginBottom: '16px', fontSize: '18px' }}>Account Information</h3>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={businessOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Occupation</IonLabel>
            <IonInput value={formData.occupation} onIonInput={handleInputChange('occupation')} onIonBlur={handleInputBlur('occupation')} placeholder="Enter your occupation" style={inputStyle} />
          </IonItem>
        </IonCol>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Annual Income</IonLabel>
            <IonInput type="number" value={formData.income} onIonInput={handleInputChange('income')} onIonBlur={handleInputBlur('income')} placeholder="Enter your annual income" style={inputStyle} />
          </IonItem>
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Account Type *</IonLabel>
            <IonSelect value={formData.accountType} onIonChange={handleInputChange('accountType')} placeholder="Select account type" style={inputStyle}>
              <IonSelectOption value="savings">Savings Account</IonSelectOption>
              <IonSelectOption value="current">Current Account</IonSelectOption>
              <IonSelectOption value="fixed">Fixed Deposit</IonSelectOption>
            </IonSelect>
          </IonItem>
          {errors.accountType && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.accountType}</IonText>}
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={lockClosedOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Password *</IonLabel>
            <IonInput type="password" value={formData.password} onIonInput={handleInputChange('password')} onIonBlur={handleInputBlur('password')} placeholder="Enter your password" style={inputStyle} />
          </IonItem>
          {errors.password && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.password}</IonText>}
        </IonCol>
        <IonCol size="12" sizeMd="6">
          <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
            <IonIcon icon={lockClosedOutline} slot="start" style={{ color: '#667eea' }} />
            <IonLabel position="stacked" style={labelStyle}>Confirm Password *</IonLabel>
            <IonInput type="password" value={formData.confirmPassword} onIonInput={handleInputChange('confirmPassword')} onIonBlur={handleInputBlur('confirmPassword')} placeholder="Confirm your password" style={inputStyle} />
          </IonItem>
          {errors.confirmPassword && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.confirmPassword}</IonText>}
        </IonCol>
      </IonRow>
      <IonRow>
        <IonCol size="12">
          <IonItem style={{ '--background': 'transparent', marginTop: '16px' }}>
            <IonCheckbox slot="start" checked={formData.agreeTerms} onIonChange={e => handleCheckboxChange('agreeTerms', e.detail.checked)} />
            <IonLabel style={{ color: 'black', fontSize: '14px' }}>
              I agree to the <span style={{ color: '#667eea', textDecoration: 'underline' }}>Terms & Conditions</span>
            </IonLabel>
          </IonItem>
          {errors.agreeTerms && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.agreeTerms}</IonText>}
        </IonCol>
      </IonRow>
    </>
  );
};

export default AccountInfoSection;