export interface Chain {
    id: string;
    title: string;

    ended: boolean;
    isPublic: boolean;
    isAnon: boolean;

    lastUpdated: number;
    secondLastUpdated: number;

    by: TelegramUser;

    replies: {
        [id: number]: {
            text: string;
            username: string;
            first_name: string;
        };
    };

    sharedInChats: string[];
}

export interface TelegramUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username: string;
    language_code?: string;
}
