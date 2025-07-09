# WebSocket Hook Usage Guide

## Basic Setup

```tsx
import { useWebSocket } from '../hooks/useWebSocket';

const MyComponent = () => {
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081');
  
  // Your component logic here
};
```

## Sending Different Types of Data

### 1. Simple Text/String Data
```tsx
const sendSimpleMessage = () => {
  send("Hello from frontend!");
};
```

### 2. Object Data (JSON)
```tsx
const sendUserData = () => {
  const userData = {
    type: 'user_action',
    action: 'button_click',
    timestamp: Date.now(),
    userId: 'user123'
  };
  send(userData);
};
```

### 3. Form Data
```tsx
const sendFormData = (formValues) => {
  const formData = {
    type: 'form_submission',
    timestamp: Date.now(),
    formData: formValues,
    page: 'LoginPage'
  };
  send(formData);
};
```

### 4. Array Data (like tap events)
```tsx
const sendArrayData = () => {
  const tapEvents = [
    { x: 100, y: 200, timestamp: Date.now() },
    { x: 150, y: 250, timestamp: Date.now() + 100 }
  ];
  send(tapEvents); // Sends array directly
};
```

### 5. Real-time Events
```tsx
// Send data on user interactions
const handleClick = (e) => {
  const clickData = {
    type: 'click',
    coordinates: { x: e.clientX, y: e.clientY },
    target: e.target.tagName,
    timestamp: Date.now()
  };
  send(clickData);
};

const handleInputChange = (fieldName, value) => {
  const inputData = {
    type: 'input_change',
    field: fieldName,
    value: value,
    length: value.length,
    timestamp: Date.now()
  };
  send(inputData);
};
```

## Using in Different Components

### Example 1: Any Component
```tsx
import { useWebSocket } from '../hooks/useWebSocket';

const AnotherComponent = () => {
  const { send, isConnected } = useWebSocket('ws://localhost:8081');
  
  const handleButtonClick = () => {
    if (isConnected) {
      send({
        type: 'button_click',
        button: 'submit',
        component: 'AnotherComponent',
        timestamp: Date.now()
      });
    }
  };

  return (
    <button onClick={handleButtonClick}>
      Send Data to WebSocket
    </button>
  );
};
```

### Example 2: Hook with useEffect
```tsx
const DataComponent = () => {
  const { send, isConnected } = useWebSocket('ws://localhost:8081');
  const [data, setData] = useState([]);

  // Send data whenever state changes
  useEffect(() => {
    if (data.length > 0 && isConnected) {
      send({
        type: 'data_update',
        data: data,
        count: data.length,
        timestamp: Date.now()
      });
    }
  }, [data, isConnected, send]);

  return <div>Data Component</div>;
};
```

## Advanced Usage

### 1. Conditional Sending
```tsx
const sendConditionalData = (userData) => {
  if (isConnected && userData.isValid) {
    send({
      type: 'validated_data',
      data: userData,
      timestamp: Date.now()
    });
  }
};
```

### 2. Batch Sending
```tsx
const sendBatchData = (events) => {
  if (isConnected && events.length > 0) {
    send({
      type: 'batch_events',
      events: events,
      batchSize: events.length,
      timestamp: Date.now()
    });
  }
};
```

### 3. Error Handling
```tsx
const SafeComponent = () => {
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081');

  const safeSend = (data) => {
    if (error) {
      console.error('WebSocket error:', error);
      return;
    }
    
    if (!isConnected) {
      console.warn('WebSocket not connected');
      return;
    }

    send(data);
  };

  return (
    <div>
      {error && <div>Connection Error: {error}</div>}
      <button onClick={() => safeSend({ message: 'test' })}>
        Send Safe Data
      </button>
    </div>
  );
};
