import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ITelegramUser, IWebApp, ThemeParams } from "../types/telegram";

export interface ITelegramContext {
    // // hideNavbar: hide if on Telegram Web App
    // hideNavbar: boolean;
    webApp?: IWebApp;
    unsafeData?: any;
    user?: ITelegramUser;
    style?: ThemeParams;
}

export const TelegramContext = createContext<ITelegramContext>({});

export const TelegramProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [themeParams, setThemeParams] = useState<ThemeParams | null>(null);
    const updateColorMode = () => {
        const newStyle = ((window as any).Telegram.WebApp as IWebApp)
            .themeParams;

        // check if it's dark or light mode
        const htmlElement = document.getElementsByTagName("html")[0];

        // @ts-ignore
        const attr = htmlElement.attributes.style.textContent;

        const newAttrArr: string[] = attr
            .replaceAll("--", "")
            .replaceAll(" ", "")
            .trim()
            .split(";");

        const isDarkMode = newAttrArr.some((attr) =>
            attr.includes("tg-color-scheme:dark")
        );

        if (isDarkMode) {
            // TODO
            newStyle.color_scheme = "dark";
        } else {
            // TODO
            newStyle.color_scheme = "light";
        }

        setThemeParams({ ...newStyle });
        // document.body.style.background = newStyle.bg_color;
    };

    // Update the color mode if it changes
    useEffect(() => {
        const app = (window as any).Telegram?.WebApp;

        if (app as IWebApp) {
            const initData = app.initData;

            if (initData) {
                updateColorMode();
            }
        }
    }, [(window as any).Telegram?.WebApp]);

    const app = (window as any).Telegram?.WebApp;

    const [webApp] = useState<IWebApp | undefined>(app);
    // const [user, setUser] = useState<ITelegramUser | undefined>(undefined);

    if (app as IWebApp) {
        const initData = app.initData;

        if (initData) {
            // There's no need to validate data, we're not dealing with sensitive information.
            // validateHash(initData)
            //     .then(() => {
            //         console.log("Data validated, you're good to go!");
            //         app.ready();
            //     })
            //     .catch((e) => {
            //         app = null;
            //     });
            app.ready();
            app.onEvent("themeChanged", updateColorMode);
            // setUser({
            //     ...app.initDataUnsafe.user,
            //     type: "telegram",
            //     id: app.initDataUnsafe.user.id.toString(),
            // });
        }
    }

    const value = useMemo(() => {
        return webApp
            ? {
                  webApp,
                  unsafeData: webApp.initDataUnsafe,
                  user: webApp.initDataUnsafe.user
                      ? {
                            ...webApp.initDataUnsafe.user,
                            type: "telegram",
                            id: webApp.initDataUnsafe.user.id,
                        }
                      : undefined,
                  style: themeParams || undefined,
              }
            : {};
    }, [webApp, themeParams]);

    return (
        <TelegramContext.Provider value={value}>
            {/* Make sure to include script tag with "beforeInteractive" strategy to pre-load web-app script */}
            {/* <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />       */}
            {children}
        </TelegramContext.Provider>
    );
};

export const useTelegram = () => useContext(TelegramContext);

export {};
