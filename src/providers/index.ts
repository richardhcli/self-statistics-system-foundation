/**
 * Centralized export for application providers.
 * Providers: A Provider uses React Context API. It is built directly into React and is designed to "broadcast" data down the component tree.
 * Mechanism: It passes data through the value prop of a Context.Provider.
 * Best For: Low-frequency updates and "Static" global data.
 * Re-render: When a Provider's value changes, all components consuming that context will re-render. This includes the main provider wrapper.
 */

export * from './auth-provider';