import moment from 'moment';
import { validateString } from '../../helper/validation';
import { Profile } from '../../service/api/profile/type';

const getProfileDateTime = (profile: Profile) => {
    const profileEmail = profile.email?.find(email => email.datetime);
    if (!profileEmail) return;
    const date = moment(validateString(profileEmail.datetime));
    if (date.isValid()) {
        return date;
    }
};

export const getRootProfile = (profiles: Profile[]) => {
    return profiles.find(item => item.root);
};

export const getStandardProfile = (profiles: Profile[]): Profile[] => {
    return profiles
        .filter(profile => !profile.root)
        .sort((a, b) => {
            const aDate = getProfileDateTime(a);
            const bDate = getProfileDateTime(b);
            if (!aDate || !bDate) {
                return -1;
            }
            return bDate.diff(aDate);
        });
};
