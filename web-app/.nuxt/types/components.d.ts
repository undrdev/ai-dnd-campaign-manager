
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

interface _GlobalComponents {
      'DndDiceRoller': typeof import("../../components/dnd/DiceRoller.vue")['default']
    'FormsFormCheckbox': typeof import("../../components/forms/FormCheckbox.vue")['default']
    'FormsFormField': typeof import("../../components/forms/FormField.vue")['default']
    'FormsFormSelect': typeof import("../../components/forms/FormSelect.vue")['default']
    'FormsFormTextarea': typeof import("../../components/forms/FormTextarea.vue")['default']
    'LayoutAppBreadcrumb': typeof import("../../components/layout/AppBreadcrumb.vue")['default']
    'LayoutAppFooter': typeof import("../../components/layout/AppFooter.vue")['default']
    'LayoutAppHeader': typeof import("../../components/layout/AppHeader.vue")['default']
    'LayoutAppLayout': typeof import("../../components/layout/AppLayout.vue")['default']
    'LayoutAppSidebar': typeof import("../../components/layout/AppSidebar.vue")['default']
    'NavigationMainNavigation': typeof import("../../components/navigation/MainNavigation.vue")['default']
    'NavigationMobileMenu': typeof import("../../components/navigation/MobileMenu.vue")['default']
    'NavigationUserMenu': typeof import("../../components/navigation/UserMenu.vue")['default']
    'UiAppAlert': typeof import("../../components/ui/AppAlert.vue")['default']
    'UiAppAvatar': typeof import("../../components/ui/AppAvatar.vue")['default']
    'UiAppBadge': typeof import("../../components/ui/AppBadge.vue")['default']
    'UiAppButton': typeof import("../../components/ui/AppButton.vue")['default']
    'UiAppCard': typeof import("../../components/ui/AppCard.vue")['default']
    'UiAppError': typeof import("../../components/ui/AppError.vue")['default']
    'UiAppInput': typeof import("../../components/ui/AppInput.vue")['default']
    'UiAppLoading': typeof import("../../components/ui/AppLoading.vue")['default']
    'UiAppModal': typeof import("../../components/ui/AppModal.vue")['default']
    'UiAppNotification': typeof import("../../components/ui/AppNotification.vue")['default']
    'UiAppTooltip': typeof import("../../components/ui/AppTooltip.vue")['default']
    'NuxtWelcome': typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
    'NuxtLayout': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
    'NuxtErrorBoundary': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
    'ClientOnly': typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
    'DevOnly': typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
    'ServerPlaceholder': typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtLink': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
    'NuxtLoadingIndicator': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
    'NuxtTime': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
    'NuxtRouteAnnouncer': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
    'NuxtImg': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
    'NuxtPicture': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
    'NuxtPage': typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
    'NuxtIsland': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
    'NuxtRouteAnnouncer': typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
      'LazyDndDiceRoller': LazyComponent<typeof import("../../components/dnd/DiceRoller.vue")['default']>
    'LazyFormsFormCheckbox': LazyComponent<typeof import("../../components/forms/FormCheckbox.vue")['default']>
    'LazyFormsFormField': LazyComponent<typeof import("../../components/forms/FormField.vue")['default']>
    'LazyFormsFormSelect': LazyComponent<typeof import("../../components/forms/FormSelect.vue")['default']>
    'LazyFormsFormTextarea': LazyComponent<typeof import("../../components/forms/FormTextarea.vue")['default']>
    'LazyLayoutAppBreadcrumb': LazyComponent<typeof import("../../components/layout/AppBreadcrumb.vue")['default']>
    'LazyLayoutAppFooter': LazyComponent<typeof import("../../components/layout/AppFooter.vue")['default']>
    'LazyLayoutAppHeader': LazyComponent<typeof import("../../components/layout/AppHeader.vue")['default']>
    'LazyLayoutAppLayout': LazyComponent<typeof import("../../components/layout/AppLayout.vue")['default']>
    'LazyLayoutAppSidebar': LazyComponent<typeof import("../../components/layout/AppSidebar.vue")['default']>
    'LazyNavigationMainNavigation': LazyComponent<typeof import("../../components/navigation/MainNavigation.vue")['default']>
    'LazyNavigationMobileMenu': LazyComponent<typeof import("../../components/navigation/MobileMenu.vue")['default']>
    'LazyNavigationUserMenu': LazyComponent<typeof import("../../components/navigation/UserMenu.vue")['default']>
    'LazyUiAppAlert': LazyComponent<typeof import("../../components/ui/AppAlert.vue")['default']>
    'LazyUiAppAvatar': LazyComponent<typeof import("../../components/ui/AppAvatar.vue")['default']>
    'LazyUiAppBadge': LazyComponent<typeof import("../../components/ui/AppBadge.vue")['default']>
    'LazyUiAppButton': LazyComponent<typeof import("../../components/ui/AppButton.vue")['default']>
    'LazyUiAppCard': LazyComponent<typeof import("../../components/ui/AppCard.vue")['default']>
    'LazyUiAppError': LazyComponent<typeof import("../../components/ui/AppError.vue")['default']>
    'LazyUiAppInput': LazyComponent<typeof import("../../components/ui/AppInput.vue")['default']>
    'LazyUiAppLoading': LazyComponent<typeof import("../../components/ui/AppLoading.vue")['default']>
    'LazyUiAppModal': LazyComponent<typeof import("../../components/ui/AppModal.vue")['default']>
    'LazyUiAppNotification': LazyComponent<typeof import("../../components/ui/AppNotification.vue")['default']>
    'LazyUiAppTooltip': LazyComponent<typeof import("../../components/ui/AppTooltip.vue")['default']>
    'LazyNuxtWelcome': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
    'LazyNuxtLayout': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
    'LazyNuxtErrorBoundary': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
    'LazyClientOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
    'LazyDevOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
    'LazyServerPlaceholder': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
    'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
    'LazyNuxtTime': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
    'LazyNuxtImg': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
    'LazyNuxtPicture': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
    'LazyNuxtPage': LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
    'LazyNoScript': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
    'LazyLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
    'LazyBase': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
    'LazyTitle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
    'LazyMeta': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
    'LazyStyle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
    'LazyHead': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
    'LazyHtml': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
    'LazyBody': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
    'LazyNuxtIsland': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
