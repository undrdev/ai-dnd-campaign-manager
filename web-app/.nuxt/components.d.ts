
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T extends DefineComponent> = T & DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>>

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = (T & DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }>)


export const DndDiceRoller: typeof import("../components/dnd/DiceRoller.vue")['default']
export const FormsFormCheckbox: typeof import("../components/forms/FormCheckbox.vue")['default']
export const FormsFormField: typeof import("../components/forms/FormField.vue")['default']
export const FormsFormSelect: typeof import("../components/forms/FormSelect.vue")['default']
export const FormsFormTextarea: typeof import("../components/forms/FormTextarea.vue")['default']
export const LayoutAppBreadcrumb: typeof import("../components/layout/AppBreadcrumb.vue")['default']
export const LayoutAppFooter: typeof import("../components/layout/AppFooter.vue")['default']
export const LayoutAppHeader: typeof import("../components/layout/AppHeader.vue")['default']
export const LayoutAppLayout: typeof import("../components/layout/AppLayout.vue")['default']
export const LayoutAppSidebar: typeof import("../components/layout/AppSidebar.vue")['default']
export const NavigationMainNavigation: typeof import("../components/navigation/MainNavigation.vue")['default']
export const NavigationMobileMenu: typeof import("../components/navigation/MobileMenu.vue")['default']
export const NavigationUserMenu: typeof import("../components/navigation/UserMenu.vue")['default']
export const UiAppAlert: typeof import("../components/ui/AppAlert.vue")['default']
export const UiAppAvatar: typeof import("../components/ui/AppAvatar.vue")['default']
export const UiAppBadge: typeof import("../components/ui/AppBadge.vue")['default']
export const UiAppButton: typeof import("../components/ui/AppButton.vue")['default']
export const UiAppCard: typeof import("../components/ui/AppCard.vue")['default']
export const UiAppError: typeof import("../components/ui/AppError.vue")['default']
export const UiAppInput: typeof import("../components/ui/AppInput.vue")['default']
export const UiAppLoading: typeof import("../components/ui/AppLoading.vue")['default']
export const UiAppModal: typeof import("../components/ui/AppModal.vue")['default']
export const UiAppNotification: typeof import("../components/ui/AppNotification.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const LazyDndDiceRoller: LazyComponent<typeof import("../components/dnd/DiceRoller.vue")['default']>
export const LazyFormsFormCheckbox: LazyComponent<typeof import("../components/forms/FormCheckbox.vue")['default']>
export const LazyFormsFormField: LazyComponent<typeof import("../components/forms/FormField.vue")['default']>
export const LazyFormsFormSelect: LazyComponent<typeof import("../components/forms/FormSelect.vue")['default']>
export const LazyFormsFormTextarea: LazyComponent<typeof import("../components/forms/FormTextarea.vue")['default']>
export const LazyLayoutAppBreadcrumb: LazyComponent<typeof import("../components/layout/AppBreadcrumb.vue")['default']>
export const LazyLayoutAppFooter: LazyComponent<typeof import("../components/layout/AppFooter.vue")['default']>
export const LazyLayoutAppHeader: LazyComponent<typeof import("../components/layout/AppHeader.vue")['default']>
export const LazyLayoutAppLayout: LazyComponent<typeof import("../components/layout/AppLayout.vue")['default']>
export const LazyLayoutAppSidebar: LazyComponent<typeof import("../components/layout/AppSidebar.vue")['default']>
export const LazyNavigationMainNavigation: LazyComponent<typeof import("../components/navigation/MainNavigation.vue")['default']>
export const LazyNavigationMobileMenu: LazyComponent<typeof import("../components/navigation/MobileMenu.vue")['default']>
export const LazyNavigationUserMenu: LazyComponent<typeof import("../components/navigation/UserMenu.vue")['default']>
export const LazyUiAppAlert: LazyComponent<typeof import("../components/ui/AppAlert.vue")['default']>
export const LazyUiAppAvatar: LazyComponent<typeof import("../components/ui/AppAvatar.vue")['default']>
export const LazyUiAppBadge: LazyComponent<typeof import("../components/ui/AppBadge.vue")['default']>
export const LazyUiAppButton: LazyComponent<typeof import("../components/ui/AppButton.vue")['default']>
export const LazyUiAppCard: LazyComponent<typeof import("../components/ui/AppCard.vue")['default']>
export const LazyUiAppError: LazyComponent<typeof import("../components/ui/AppError.vue")['default']>
export const LazyUiAppInput: LazyComponent<typeof import("../components/ui/AppInput.vue")['default']>
export const LazyUiAppLoading: LazyComponent<typeof import("../components/ui/AppLoading.vue")['default']>
export const LazyUiAppModal: LazyComponent<typeof import("../components/ui/AppModal.vue")['default']>
export const LazyUiAppNotification: LazyComponent<typeof import("../components/ui/AppNotification.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>

export const componentNames: string[]
