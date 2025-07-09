import React from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonText,
  IonCol,
  IonRow,
  IonBadge,
  IonRippleEffect
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  callOutline,
  cardOutline,
  documentTextOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

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

const PersonalInfoSection: React.FC<PersonalInfoProps> = ({
  formData,
  errors,
  handleInputChange,
  handleInputBlur
}) => {

  const sectionHeaderStyle = {
    background: 'linear-gradient(135deg, #1a1b3a 0%, #2d1b69 50%, #11998e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '22px',
    fontWeight: '800',
    marginBottom: '24px',
    letterSpacing: '-0.5px',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const inputItemStyle = {
    '--background': 'rgba(255, 255, 255, 0.95)',
    '--border-radius': '16px',
    '--box-shadow': '0 8px 32px rgba(26, 27, 58, 0.08), 0 4px 16px rgba(17, 153, 142, 0.06)',
    '--border-color': 'transparent',
    '--inner-padding-end': '16px',
    '--inner-padding-start': '16px',
    '--padding-start': '0px',
    '--padding-end': '0px',
    marginBottom: '16px',
    border: '1px solid rgba(203, 213, 225, 0.3)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const focusedInputStyle = {
    ...inputItemStyle,
    '--box-shadow': '0 12px 40px rgba(17, 153, 142, 0.15), 0 6px 20px rgba(26, 27, 58, 0.1)',
    border: '1px solid rgba(17, 153, 142, 0.3)',
    transform: 'translateY(-2px)'
  };

  const labelStyle = {
    color: '#1a1b3a',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  };

  const inputStyle = {
    color: '#1a1b3a',
    fontSize: '16px',
    fontWeight: '500',
    '--placeholder-color': '#94a3b8',
    '--placeholder-opacity': '0.8'
  };

  const iconStyle = {
    fontSize: '22px',
    background: 'linear-gradient(135deg, #1a1b3a 0%, #11998e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginRight: '4px'
  };

  const errorStyle = {
    fontSize: '13px',
    fontWeight: '500',
    marginLeft: '16px',
    marginTop: '4px',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };


  const isFieldFilled = (field: keyof FormData) => formData[field] && formData[field].trim() !== '';

  return (
    <>
      {/* Section Header */}
      <IonRow>
        <IonCol size="12">
          <div style={sectionHeaderStyle}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #1a1b3a 0%, #11998e 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(26, 27, 58, 0.2)',
              transform: 'rotate(-3deg)'
            }}>
              <IonIcon
                icon={personOutline}
                style={{
                  color: 'white',
                  fontSize: '20px',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                }}
              />
            </div>
            Personal Information

          </div>
        </IonCol>
      </IonRow>

      {/* Name Fields */}
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <div style={{ position: 'relative' }}>
            <IonItem
              style={isFieldFilled('firstName') ? focusedInputStyle : inputItemStyle}
              className="custom-input-item"
            >
              <IonRippleEffect />
              <IonIcon icon={personOutline} slot="start" style={iconStyle} />
              <IonLabel position="stacked" style={labelStyle}>
                First Name *
              </IonLabel>
              <IonInput
                value={formData.firstName}
                onIonInput={handleInputChange('firstName')}
                onIonBlur={handleInputBlur('firstName')}
                placeholder="Enter your first name"
                style={inputStyle}
                clearInput
              />
              {isFieldFilled('firstName') && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  slot="end"
                  style={{
                    color: '#10b981',
                    fontSize: '18px',
                    filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))'
                  }}
                />
              )}
            </IonItem>
            {errors.firstName && (
              <IonText style={errorStyle}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                {errors.firstName}
              </IonText>
            )}
          </div>
        </IonCol>

        <IonCol size="12" sizeMd="6">
          <div style={{ position: 'relative' }}>
            <IonItem
              style={isFieldFilled('lastName') ? focusedInputStyle : inputItemStyle}
              className="custom-input-item"
            >
              <IonRippleEffect />
              <IonIcon icon={personOutline} slot="start" style={iconStyle} />
              <IonLabel position="stacked" style={labelStyle}>
                Last Name *
              </IonLabel>
              <IonInput
                value={formData.lastName}
                onIonInput={handleInputChange('lastName')}
                onIonBlur={handleInputBlur('lastName')}
                placeholder="Enter your last name"
                style={inputStyle}
                clearInput
              />
              {isFieldFilled('lastName') && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  slot="end"
                  style={{
                    color: '#10b981',
                    fontSize: '18px',
                    filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))'
                  }}
                />
              )}
            </IonItem>
            {errors.lastName && (
              <IonText style={errorStyle}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                {errors.lastName}
              </IonText>
            )}
          </div>
        </IonCol>
      </IonRow>

      {/* Contact Fields */}
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <div style={{ position: 'relative' }}>
            <IonItem
              style={isFieldFilled('email') ? focusedInputStyle : inputItemStyle}
              className="custom-input-item"
            >
              <IonRippleEffect />
              <IonIcon icon={mailOutline} slot="start" style={iconStyle} />
              <IonLabel position="stacked" style={labelStyle}>
                Email Address *
              </IonLabel>
              <IonInput
                type="email"
                value={formData.email}
                onIonInput={handleInputChange('email')}
                onIonBlur={handleInputBlur('email')}
                placeholder="Enter your email"
                style={inputStyle}
                clearInput
              />
              {isFieldFilled('email') && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  slot="end"
                  style={{
                    color: '#10b981',
                    fontSize: '18px',
                    filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))'
                  }}
                />
              )}
            </IonItem>
            {errors.email && (
              <IonText style={errorStyle}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                {errors.email}
              </IonText>
            )}
          </div>
        </IonCol>

        <IonCol size="12" sizeMd="6">
          <div style={{ position: 'relative' }}>
            <IonItem
              style={isFieldFilled('phone') ? focusedInputStyle : inputItemStyle}
              className="custom-input-item"
            >
              <IonRippleEffect />
              <IonIcon icon={callOutline} slot="start" style={iconStyle} />
              <IonLabel position="stacked" style={labelStyle}>
                Phone Number *
              </IonLabel>
              <IonInput
                type="tel"
                value={formData.phone}
                onIonInput={handleInputChange('phone')}
                onIonBlur={handleInputBlur('phone')}
                placeholder="Enter your phone number"
                style={inputStyle}
                clearInput
              />
              {isFieldFilled('phone') && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  slot="end"
                  style={{
                    color: '#10b981',
                    fontSize: '18px',
                    filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))'
                  }}
                />
              )}
            </IonItem>
            {errors.phone && (
              <IonText style={errorStyle}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                {errors.phone}
              </IonText>
            )}
          </div>
        </IonCol>
      </IonRow>

      {/* Document Fields */}
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <div style={{ position: 'relative' }}>
            <IonItem
              style={isFieldFilled('aadhar') ? focusedInputStyle : inputItemStyle}
              className="custom-input-item"
            >
              <IonRippleEffect />
              <IonIcon icon={documentTextOutline} slot="start" style={iconStyle} />
              <IonLabel position="stacked" style={labelStyle}>
                Aadhar Number *
                <IonBadge
                  style={{
                    marginLeft: '8px',
                    '--background': 'rgba(239, 68, 68, 0.1)',
                    '--color': '#ef4444',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}
                >
                  12 digits
                </IonBadge>
              </IonLabel>
              <IonInput
                value={formData.aadhar}
                onIonInput={handleInputChange('aadhar')}
                onIonBlur={handleInputBlur('aadhar')}
                placeholder="Enter your Aadhar number"
                style={inputStyle}
                maxlength={12}
                clearInput
              />
              {isFieldFilled('aadhar') && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  slot="end"
                  style={{
                    color: '#10b981',
                    fontSize: '18px',
                    filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))'
                  }}
                />
              )}
            </IonItem>
            {errors.aadhar && (
              <IonText style={errorStyle}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                {errors.aadhar}
              </IonText>
            )}
          </div>
        </IonCol>

        <IonCol size="12" sizeMd="6">
          <div style={{ position: 'relative' }}>
            <IonItem
              style={isFieldFilled('pan') ? focusedInputStyle : inputItemStyle}
              className="custom-input-item"
            >
              <IonRippleEffect />
              <IonIcon icon={cardOutline} slot="start" style={iconStyle} />
              <IonLabel position="stacked" style={labelStyle}>
                PAN Number *
                <IonBadge
                  style={{
                    marginLeft: '8px',
                    '--background': 'rgba(59, 130, 246, 0.1)',
                    '--color': '#3b82f6',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}
                >
                  ABCDE1234F
                </IonBadge>
              </IonLabel>
              <IonInput
                value={formData.pan}
                onIonInput={handleInputChange('pan')}
                onIonBlur={handleInputBlur('pan')}
                placeholder="Enter your PAN number"
                style={{
                  ...inputStyle,
                  textTransform: 'uppercase'
                }}
                maxlength={10}
                clearInput
              />
              {isFieldFilled('pan') && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  slot="end"
                  style={{
                    color: '#10b981',
                    fontSize: '18px',
                    filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3))'
                  }}
                />
              )}
            </IonItem>
            {errors.pan && (
              <IonText style={errorStyle}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                {errors.pan}
              </IonText>
            )}
          </div>
        </IonCol>
      </IonRow>

      {/* Decorative Separator */}
      <IonRow style={{ marginTop: '32px', marginBottom: '16px' }}>
        <IonCol size="12">
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(17, 153, 142, 0.3) 50%, transparent 100%)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              background: 'linear-gradient(135deg, #11998e, #1a1b3a)',
              borderRadius: '50%',
              boxShadow: '0 0 12px rgba(17, 153, 142, 0.4)'
            }} />
          </div>
        </IonCol>
      </IonRow>
    </>
  );
};

export default PersonalInfoSection;