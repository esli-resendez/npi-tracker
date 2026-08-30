import * as React from 'react';
import {
	Button,
	Field,
	Input,
	List,
	ListItem,
	makeStyles,
	Tag,
	TagGroup,
	Text,
} from '@fluentui/react-components';

import type { BuildData } from '../../models/BuildData';


export type UserCaptureProps = {
	buildData: BuildData;
	setBuildData: React.Dispatch<React.SetStateAction<BuildData>>;
};

const useStyles = makeStyles({
	root: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' },
	entry: { display: 'flex', gap: '8px', alignItems: 'flex-end' },
	tags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Captures the users assigned to a build and stores them in BuildData.team. */
export default function UserCapture({ buildData, setBuildData }: UserCaptureProps) {
	const styles = useStyles();
	const [email, setEmail] = React.useState('');
	const [error, setError] = React.useState('');

const addEmails = () => {
    const candidates = email
        .split(/[;,\s]+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const invalid = candidates.find((value) => !emailPattern.test(value));

    if (invalid) {
        setError(`${invalid} is not a valid email address.`);
        return;
    }

    setBuildData((current) => {
        const existingEmails = new Set(
            (current.team ?? []).map((member) => member.user_email)
        );

        candidates.forEach((value) => existingEmails.add(value));

        return {
            ...current,
            team: Array.from(existingEmails).map((user_email) => ({ user_email })),
        };
    });

    setEmail('');
    setError('');
};

const removeEmail = (userEmail: string) => {
    setBuildData((current) => ({
        ...current,
        team: (current.team ?? []).filter((member) => member.user_email !== userEmail),
    }));
};

	return (
		<div className={styles.root}>
			<Text weight="semibold" size={500}>Assign users</Text>
			<Text>Add one or more email addresses to this build.</Text>
			<div className={styles.entry}>
				<Field
					label="Email addresses"
					validationState={error ? 'error' : 'none'}
					validationMessage={error}
					hint="Separate multiple addresses with spaces, commas, or semicolons."
					style={{ flex: 1 }}
				>
					<Input
						value={email}
						onChange={(_, data) => setEmail(data.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								addEmails();
							}
						}}
						placeholder="name@example.com"
					/>
				</Field>
				<Button appearance="primary" onClick={addEmails} disabled={!email.trim()}>
					Add
				</Button>
			</div>
            {buildData.team?.length > 0 && (
                <TagGroup className={styles.tags} aria-label="Assigned users">
                    {buildData.team.map(({ user_email }) => (
                        <Tag
                            key={user_email}
                            dismissible
                            dismissIcon={{ 'aria-label': `Remove ${user_email}` }}
                            onClick={() => removeEmail(user_email)}
                        >
                            {user_email}
                        </Tag>
                    ))}
                </TagGroup>
            )}
		</div>
	);
}
