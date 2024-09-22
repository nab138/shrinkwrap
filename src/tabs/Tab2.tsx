import React from 'react';
import { IDockviewPanelProps } from 'dockview';

const Tab2: React.FC<IDockviewPanelProps<{ title: string }>> = (props) => {
    return (
        <div style={{ padding: '20px', color: 'white' }}>
            {props.params.title} - Tab 2
        </div>
    );
};

export default Tab2;