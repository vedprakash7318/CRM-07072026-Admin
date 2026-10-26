import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

export default function RangeSelectionModal({ visible, onHide, onSelect }) {
    const [from, setFrom] = useState(1);
    const [to, setTo] = useState(100);
    const [loading, setLoading] = useState(false);

    const handleSelect = async () => {
        if (from < 1 || to < from) {
            return;
        }
        setLoading(true);
        await onSelect(from, to);
        setLoading(false);
        onHide();
    };

    return (
        <Dialog 
            header="Select Leads by Range" 
            visible={visible} 
            style={{ width: '30vw', minWidth: '300px' }} 
            onHide={onHide}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                <div className="p-field">
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From (Row Number)</label>
                    <InputNumber 
                        value={from} 
                        onValueChange={(e) => setFrom(e.value)} 
                        min={1} 
                        style={{ width: '100%' }}
                    />
                </div>
                <div className="p-field">
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To (Row Number)</label>
                    <InputNumber 
                        value={to} 
                        onValueChange={(e) => setTo(e.value)} 
                        min={from} 
                        style={{ width: '100%' }}
                    />
                </div>
                <Button 
                    label={loading ? 'Selecting...' : 'Select Leads'} 
                    icon="pi pi-check" 
                    onClick={handleSelect} 
                    disabled={loading || !from || !to}
                    style={{ marginTop: '10px', background: '#3454D1', border: 'none', color: 'white', padding: '10px', borderRadius: '5px' }}
                />
            </div>
        </Dialog>
    );
}
