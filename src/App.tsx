import React, { useEffect, useState } from "react";

import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";

import "./App.css";
import { COLLECTION_NAME, fireDb } from "./firebase";
import { Chain } from "./types/types";

import { useTelegram } from "./providers/TelegramProvider";

function App() {
    const hasStartApp = window.location.href.includes("tgWebAppStartParam");

    const startParam = window.location.href.split("#")[0];
    // .split("/")
    // .find((s) => s.includes("tgWebAppStartParam"))
    // ?.replace("tgWebAppStartParam", "")
    // .replace("?", "")
    // .replace("=", "")
    // .replace("#", "");

    const [chain, setChain] = useState<Chain>();

    if (!hasStartApp || !startParam) {
        // return <Navigate to="/create" state={{ from: location }} replace />;
        return <>Missing start app param</>;
    }

    const chainId = startParam.split("__-__")[1];

    // console.log({ type, val });

    const { user, style } = useTelegram();
    console.log({ style });
    const [message, setMessage] = useState("");
    const [isMessageTouched, setIsMessageTouched] = useState(false);
    const [savingInSeconds, setSavingInSeconds] = useState(0);

    useEffect(() => {
        if (savingInSeconds <= 0) return;
        const timeout = setTimeout(() => {
            setSavingInSeconds((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [savingInSeconds]);

    /**
     * Updates the message state
     *
     * @param e The change event
     */
    const onMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.trim().length > 1024) {
            return;
        }
        setMessage(e.target.value);
        setDataIsSaved(false);
        setIsMessageTouched(true);
        setSavingInSeconds(2);
    };

    // Set up live listener to chain
    // get the chain ID first
    useEffect(() => {
        if (!user) return;
        const ref = doc(fireDb, COLLECTION_NAME, chainId);

        const unsubscribe = onSnapshot(ref, {
            next: (doc) => {
                const data = doc.data() as Chain;
                console.log(data);
                if (!data) {
                    // error!
                    console.log("Chain not found");
                } else {
                    setChain(data);

                    if (!isMessageTouched) {
                        // user hasn't touched the message box yet
                        setMessage(data.replies[user?.id]?.text || "");
                    }
                }
            },
        });

        return () => unsubscribe();
    }, [chainId, isMessageTouched, user]);

    // Timeout to save data
    const [dataIsSaved, setDataIsSaved] = useState(true);
    useEffect(() => {
        if (!chain || !user) return;
        const timeout = setTimeout(() => {
            console.log(`Saving data... for ${chainId}`);
            // TODO
            const docRef = doc(fireDb, COLLECTION_NAME, chainId);
            console.log(docRef);

            getDoc(docRef)
                .then((updatedDocData) => {
                    const chain = updatedDocData.data() as Chain;
                    console.log({ chain, sdf: "sdf" });
                    return updateDoc(docRef, {
                        replies: {
                            ...chain.replies,
                            [Number(user.id)]: {
                                text: message,
                                username: user.username,
                                first_name: user.first_name,
                            },
                        },
                    });
                })
                .then(() => {
                    setDataIsSaved(true);
                    setSavingInSeconds(0);
                })
                .catch(console.log);
        }, 1500);

        return () => clearTimeout(timeout);
    }, [message]);

    if (!chain || !user)
        return <div className="container mx-auto mt-3 px-3"> Loading... </div>;

    return (
        <div className={`container mx-auto mt-3 px-3 ${style?.color_scheme}`}>
            <div className="stack">
                <div className="mb-4">
                    <div className="text-2xl font-bold dark:text-white ">
                        {chain.title}
                    </div>
                    <div className="text-sm font-light">
                        <a
                            className="text-blue-700 dark:text-blue-300 hover:underline"
                            href={`https://t.me/${chain.by.username}`}
                        >
                            by {chain.by.first_name}
                        </a>
                    </div>
                </div>

                {!chain.ended ? (
                    <>
                        <div className="mb-4">
                            <label
                                htmlFor="message"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200"
                            >
                                Your message
                            </label>
                            <textarea
                                id="message"
                                rows={4}
                                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 dark:bg-gray-800  rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Write anything here!"
                                value={message}
                                onChange={onMessageChange}
                                style={{
                                    backgroundColor: style?.secondary_bg_color,
                                    borderColor: style?.button_color,
                                }}
                            ></textarea>

                            <p className="text-sm font-light ml-1 dark:text-gray-400 text-gray-800">
                                Your message will be saved when you stop typing.
                            </p>
                            {
                                <p
                                    className={`text-sm font-light ml-1 dark:text-gray-400 text-gray-800 ${
                                        dataIsSaved ? "invisible" : "visible"
                                    }`}
                                >
                                    Saving in {savingInSeconds} seconds...
                                </p>
                            }
                        </div>
                        <div
                            className="mb-4 w-full bg-gray-600 dark:bg-gray-400"
                            style={{ height: "1px" }}
                        >
                            {" "}
                        </div>
                    </>
                ) : (
                    <div className="mb-4 dark:text-white">
                        {" "}
                        Chain has ended! You can no longer reply.{" "}
                    </div>
                )}
                <div className="mb-4">
                    {Object.keys(chain.replies).map((userId, i) => {
                        const reply = chain.replies[Number(userId)];
                        return (
                            <div key={i} className="mb-2">
                                <div className="flex">
                                    <div className="font-bold dark:text-white">
                                        {" "}
                                        {reply.first_name}
                                    </div>
                                    <div className="ml-2">
                                        <a
                                            href={`https://t.me/${reply.username}`}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="text-blue-700 hover:underline dark:text-blue-300"
                                        >
                                            @{reply.username}{" "}
                                        </a>
                                    </div>
                                </div>
                                <div className="whitespace-break-spaces dark:text-white break-words">
                                    {reply.text}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default App;
