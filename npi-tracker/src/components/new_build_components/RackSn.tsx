import { Button, Label, Input } from '@fluentui/react-components';
import { useState } from 'react';

const MAX_SERIAL_NUMBERS = 50;

const RackSn = () => {
	const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);

	const updateSerialNumber = (index: number, value: string) => {
		setSerialNumbers((current) =>
			current.map((serialNumber, serialIndex) =>
				serialIndex === index ? value : serialNumber,
			),
		);
	};

	const addSerialNumber = () => {
		if (serialNumbers.length < MAX_SERIAL_NUMBERS) {
			setSerialNumbers((current) => [...current, '']);
		}
	};

	return (
		<div id='capture_sn_main'>
			{serialNumbers.map((serialNumber, index) => {
				const inputId = `rack-serial-${index + 1}`;

				return (
					<div key={inputId}>
						<Label htmlFor={inputId}>Rack Serial {index + 1}</Label>
						<Input
							id={inputId}
							name={inputId}
							type="text"
							value={serialNumber}
							onChange={(event) =>
								updateSerialNumber(index, event.target.value)
							}
						/>
					</div>
				);
			})}

			<Button
				type="button"
				onClick={addSerialNumber}
				disabled={serialNumbers.length >= MAX_SERIAL_NUMBERS}
				aria-label="Add rack serial number"
			>
				+
			</Button>
		</div>
	);
};

export default RackSn;
