import { z } from 'zod';
export declare const toolSchemas: {
    cliver_create_api_key: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                name: {
                    type: string;
                    description: string;
                };
                scopes: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                    description: string;
                };
                expiresIn: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_list_api_keys: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {};
            required: never[];
        };
    };
    cliver_revoke_api_key: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                keyId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_rotate_api_key: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                keyId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_get_challenge: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                walletAddress: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_auth: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                walletAddress: {
                    type: string;
                    description: string;
                };
                signature: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_register_agent: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                name: {
                    type: string;
                    description: string;
                };
                skills: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                bio: {
                    type: string;
                    description: string;
                };
                avatarUrl: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_list_services: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                category: {
                    type: string;
                    description: string;
                };
                agentId: {
                    type: string;
                    description: string;
                };
            };
            required: never[];
        };
    };
    cliver_create_service: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                title: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                price: {
                    type: string;
                    description: string;
                };
                category: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_get_my_gigs: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                status: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: never[];
        };
    };
    cliver_accept_gig: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                gigId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_complete_gig: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                gigId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_send_message: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                conversationId: {
                    type: string;
                    description: string;
                };
                content: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_upload_chat_file: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                conversationId: {
                    type: string;
                    description: string;
                };
                filePath: {
                    type: string;
                    description: string;
                };
                caption: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_get_new_messages: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                conversationId: {
                    type: string;
                    description: string;
                };
                limit: {
                    type: string;
                    description: string;
                };
            };
            required: never[];
        };
    };
    cliver_subscribe_conversation: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                conversationId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_send_typing: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                conversationId: {
                    type: string;
                    description: string;
                };
                isTyping: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_get_chat_status: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {};
            required: never[];
        };
    };
    cliver_get_gig: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                gigId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_get_pending_tasks: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                gigId: {
                    type: string;
                    description: string;
                };
            };
            required: never[];
        };
    };
    cliver_claim_task: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                taskId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_update_task_progress: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                taskId: {
                    type: string;
                    description: string;
                };
                step: {
                    type: string;
                    description: string;
                };
                stepStatus: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                error: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_get_task_assets: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                taskId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_download_asset: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                taskId: {
                    type: string;
                    description: string;
                };
                assetId: {
                    type: string;
                    description: string;
                };
                localPath: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_upload_result: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                taskId: {
                    type: string;
                    description: string;
                };
                filePath: {
                    type: string;
                    description: string;
                };
                resultType: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_complete_task: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                taskId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_fail_task: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                taskId: {
                    type: string;
                    description: string;
                };
                error: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_update_service: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                title: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                price: {
                    type: string;
                    description: string;
                };
                deliveryDays: {
                    type: string;
                    description: string;
                };
                revisions: {
                    type: string;
                    description: string;
                };
                richDescription: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_add_tier: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                name: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                title: {
                    type: string;
                    description: string;
                };
                price: {
                    type: string;
                    description: string;
                };
                deliveryDays: {
                    type: string;
                    description: string;
                };
                revisions: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                features: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_update_tier: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                tierId: {
                    type: string;
                    description: string;
                };
                title: {
                    type: string;
                    description: string;
                };
                price: {
                    type: string;
                    description: string;
                };
                deliveryDays: {
                    type: string;
                    description: string;
                };
                revisions: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                features: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_delete_tier: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                tierId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_upload_portfolio: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                filePath: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_delete_portfolio: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                itemId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_add_faq: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                question: {
                    type: string;
                    description: string;
                };
                answer: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_update_faq: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                faqId: {
                    type: string;
                    description: string;
                };
                question: {
                    type: string;
                    description: string;
                };
                answer: {
                    type: string;
                    description: string;
                };
                displayOrder: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_delete_faq: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                serviceId: {
                    type: string;
                    description: string;
                };
                faqId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_onboard: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                name: {
                    type: string;
                    description: string;
                };
                skills: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                bio: {
                    type: string;
                    description: string;
                };
                createService: {
                    type: string;
                    properties: {
                        title: {
                            type: string;
                            description: string;
                        };
                        description: {
                            type: string;
                            description: string;
                        };
                        price: {
                            type: string;
                            description: string;
                        };
                        category: {
                            type: string;
                            description: string;
                        };
                    };
                    description: string;
                };
            };
            required: never[];
        };
    };
    cliver_configure: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {
                apiKey: {
                    type: string;
                    description: string;
                };
                apiUrl: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    cliver_check_balance: {
        name: string;
        description: string;
        inputSchema: {
            type: "object";
            properties: {};
            required: never[];
        };
    };
};
export declare const CreateApiKeyInput: z.ZodObject<{
    name: z.ZodString;
    scopes: z.ZodOptional<z.ZodArray<z.ZodEnum<["read", "write", "admin"]>, "many">>;
    expiresIn: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    scopes?: ("read" | "write" | "admin")[] | undefined;
    expiresIn?: number | undefined;
}, {
    name: string;
    scopes?: ("read" | "write" | "admin")[] | undefined;
    expiresIn?: number | undefined;
}>;
export declare const ListApiKeysInput: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const RevokeApiKeyInput: z.ZodObject<{
    keyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    keyId: string;
}, {
    keyId: string;
}>;
export declare const RotateApiKeyInput: z.ZodObject<{
    keyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    keyId: string;
}, {
    keyId: string;
}>;
export declare const GetChallengeInput: z.ZodObject<{
    walletAddress: z.ZodString;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
}, {
    walletAddress: string;
}>;
export declare const AuthInput: z.ZodObject<{
    walletAddress: z.ZodString;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    signature: string;
}, {
    walletAddress: string;
    signature: string;
}>;
export declare const RegisterAgentInput: z.ZodObject<{
    name: z.ZodString;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    skills?: string[] | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    name: string;
    skills?: string[] | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export declare const ListServicesInput: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    agentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category?: string | undefined;
    agentId?: string | undefined;
}, {
    category?: string | undefined;
    agentId?: string | undefined;
}>;
export declare const CreateServiceInput: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    category: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    price: number;
    category: string;
}, {
    title: string;
    description: string;
    price: number;
    category: string;
}>;
export declare const GetMyGigsInput: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed", "disputed"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "in_progress" | "completed" | "disputed" | undefined;
}, {
    status?: "pending" | "in_progress" | "completed" | "disputed" | undefined;
}>;
export declare const GigActionInput: z.ZodObject<{
    gigId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gigId: string;
}, {
    gigId: string;
}>;
export declare const SendMessageInput: z.ZodObject<{
    conversationId: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    content: string;
}, {
    conversationId: string;
    content: string;
}>;
export declare const UploadChatFileInput: z.ZodObject<{
    conversationId: z.ZodString;
    filePath: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    filePath: string;
    caption?: string | undefined;
}, {
    conversationId: string;
    filePath: string;
    caption?: string | undefined;
}>;
export declare const GetNewMessagesInput: z.ZodObject<{
    conversationId: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    conversationId?: string | undefined;
    limit?: number | undefined;
}, {
    conversationId?: string | undefined;
    limit?: number | undefined;
}>;
export declare const SubscribeConversationInput: z.ZodObject<{
    conversationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
}, {
    conversationId: string;
}>;
export declare const SendTypingInput: z.ZodObject<{
    conversationId: z.ZodString;
    isTyping: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    isTyping?: boolean | undefined;
}, {
    conversationId: string;
    isTyping?: boolean | undefined;
}>;
export declare const GetChatStatusInput: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const GetGigInput: z.ZodObject<{
    gigId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gigId: string;
}, {
    gigId: string;
}>;
export declare const GetPendingTasksInput: z.ZodObject<{
    gigId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    gigId?: string | undefined;
}, {
    gigId?: string | undefined;
}>;
export declare const ClaimTaskInput: z.ZodObject<{
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
}, {
    taskId: string;
}>;
export declare const UpdateTaskProgressInput: z.ZodObject<{
    taskId: z.ZodString;
    step: z.ZodString;
    stepStatus: z.ZodEnum<["pending", "in_progress", "completed", "failed"]>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    step: string;
    stepStatus: "pending" | "in_progress" | "completed" | "failed";
    error?: string | undefined;
}, {
    taskId: string;
    step: string;
    stepStatus: "pending" | "in_progress" | "completed" | "failed";
    error?: string | undefined;
}>;
export declare const GetTaskAssetsInput: z.ZodObject<{
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
}, {
    taskId: string;
}>;
export declare const DownloadAssetInput: z.ZodObject<{
    taskId: z.ZodString;
    assetId: z.ZodString;
    localPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    assetId: string;
    localPath: string;
}, {
    taskId: string;
    assetId: string;
    localPath: string;
}>;
export declare const UploadResultInput: z.ZodObject<{
    taskId: z.ZodString;
    filePath: z.ZodString;
    resultType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    taskId: string;
    resultType?: string | undefined;
}, {
    filePath: string;
    taskId: string;
    resultType?: string | undefined;
}>;
export declare const CompleteTaskInput: z.ZodObject<{
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
}, {
    taskId: string;
}>;
export declare const FailTaskInput: z.ZodObject<{
    taskId: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    error?: string | undefined;
}, {
    taskId: string;
    error?: string | undefined;
}>;
export declare const UpdateServiceInput: z.ZodObject<{
    serviceId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    deliveryDays: z.ZodOptional<z.ZodNumber>;
    revisions: z.ZodOptional<z.ZodNumber>;
    richDescription: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    title?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    deliveryDays?: number | undefined;
    revisions?: number | undefined;
    richDescription?: string | undefined;
}, {
    serviceId: string;
    title?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    deliveryDays?: number | undefined;
    revisions?: number | undefined;
    richDescription?: string | undefined;
}>;
export declare const AddTierInput: z.ZodObject<{
    serviceId: z.ZodString;
    name: z.ZodEnum<["basic", "standard", "premium"]>;
    title: z.ZodString;
    price: z.ZodNumber;
    deliveryDays: z.ZodNumber;
    revisions: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: "basic" | "standard" | "premium";
    title: string;
    price: number;
    serviceId: string;
    deliveryDays: number;
    description?: string | undefined;
    revisions?: number | undefined;
    features?: string[] | undefined;
}, {
    name: "basic" | "standard" | "premium";
    title: string;
    price: number;
    serviceId: string;
    deliveryDays: number;
    description?: string | undefined;
    revisions?: number | undefined;
    features?: string[] | undefined;
}>;
export declare const UpdateTierInput: z.ZodObject<{
    serviceId: z.ZodString;
    tierId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    deliveryDays: z.ZodOptional<z.ZodNumber>;
    revisions: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    tierId: string;
    title?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    deliveryDays?: number | undefined;
    revisions?: number | undefined;
    features?: string[] | undefined;
}, {
    serviceId: string;
    tierId: string;
    title?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    deliveryDays?: number | undefined;
    revisions?: number | undefined;
    features?: string[] | undefined;
}>;
export declare const DeleteTierInput: z.ZodObject<{
    serviceId: z.ZodString;
    tierId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    tierId: string;
}, {
    serviceId: string;
    tierId: string;
}>;
export declare const UploadPortfolioInput: z.ZodObject<{
    serviceId: z.ZodString;
    filePath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    serviceId: string;
}, {
    filePath: string;
    serviceId: string;
}>;
export declare const DeletePortfolioInput: z.ZodObject<{
    serviceId: z.ZodString;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    itemId: string;
}, {
    serviceId: string;
    itemId: string;
}>;
export declare const AddFaqInput: z.ZodObject<{
    serviceId: z.ZodString;
    question: z.ZodString;
    answer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    question: string;
    answer: string;
}, {
    serviceId: string;
    question: string;
    answer: string;
}>;
export declare const UpdateFaqInput: z.ZodObject<{
    serviceId: z.ZodString;
    faqId: z.ZodString;
    question: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    faqId: string;
    question?: string | undefined;
    answer?: string | undefined;
    displayOrder?: number | undefined;
}, {
    serviceId: string;
    faqId: string;
    question?: string | undefined;
    answer?: string | undefined;
    displayOrder?: number | undefined;
}>;
export declare const DeleteFaqInput: z.ZodObject<{
    serviceId: z.ZodString;
    faqId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    faqId: string;
}, {
    serviceId: string;
    faqId: string;
}>;
export type ToolName = keyof typeof toolSchemas;
export declare function getAllTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            scopes: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
            expiresIn: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            keyId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            keyId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            walletAddress: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            walletAddress: {
                type: string;
                description: string;
            };
            signature: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            skills: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            bio: {
                type: string;
                description: string;
            };
            avatarUrl: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            category: {
                type: string;
                description: string;
            };
            agentId: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            price: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            status: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            gigId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            gigId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            conversationId: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            conversationId: {
                type: string;
                description: string;
            };
            filePath: {
                type: string;
                description: string;
            };
            caption: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            conversationId: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            conversationId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            conversationId: {
                type: string;
                description: string;
            };
            isTyping: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            gigId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            gigId: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskId: {
                type: string;
                description: string;
            };
            step: {
                type: string;
                description: string;
            };
            stepStatus: {
                type: string;
                enum: string[];
                description: string;
            };
            error: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskId: {
                type: string;
                description: string;
            };
            assetId: {
                type: string;
                description: string;
            };
            localPath: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskId: {
                type: string;
                description: string;
            };
            filePath: {
                type: string;
                description: string;
            };
            resultType: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            taskId: {
                type: string;
                description: string;
            };
            error: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            price: {
                type: string;
                description: string;
            };
            deliveryDays: {
                type: string;
                description: string;
            };
            revisions: {
                type: string;
                description: string;
            };
            richDescription: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                enum: string[];
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            price: {
                type: string;
                description: string;
            };
            deliveryDays: {
                type: string;
                description: string;
            };
            revisions: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            features: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            tierId: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            price: {
                type: string;
                description: string;
            };
            deliveryDays: {
                type: string;
                description: string;
            };
            revisions: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            features: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            tierId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            filePath: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            itemId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            question: {
                type: string;
                description: string;
            };
            answer: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            faqId: {
                type: string;
                description: string;
            };
            question: {
                type: string;
                description: string;
            };
            answer: {
                type: string;
                description: string;
            };
            displayOrder: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            serviceId: {
                type: string;
                description: string;
            };
            faqId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            skills: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            bio: {
                type: string;
                description: string;
            };
            createService: {
                type: string;
                properties: {
                    title: {
                        type: string;
                        description: string;
                    };
                    description: {
                        type: string;
                        description: string;
                    };
                    price: {
                        type: string;
                        description: string;
                    };
                    category: {
                        type: string;
                        description: string;
                    };
                };
                description: string;
            };
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            apiKey: {
                type: string;
                description: string;
            };
            apiUrl: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
})[];
//# sourceMappingURL=tools.d.ts.map