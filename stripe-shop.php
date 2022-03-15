<?php

namespace Grav\Plugin;

use Grav\Common\Assets;
use Grav\Common\Page\Page;
use Grav\Common\Page\Pages;
use Grav\Common\Page\Types;
use Grav\Common\Plugin;
use RocketTheme\Toolbox\Event\Event;

/**
 * Class StripeShopPlugin
 * @package Grav\Plugin
 */
class StripeShopPlugin extends Plugin
{
    private $configs;

    /**
     * @return array
     *
     * The getSubscribedEvents() gives the core a list of events
     *     that the plugin wants to listen to. The key of each
     *     array section is the event that the plugin listens to
     *     and the value (in the form of an array) contains the
     *     callable (or function) as well as the priority. The
     *     higher the number the higher the priority.
     */
    public static function getSubscribedEvents()
    {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 0],
            'onGetPageTemplates' => ['onGetPageTemplates', 0],
            'onGetPageBlueprints' => ['onGetPageBlueprints', 0]
        ];
    }

    /**
     * Initialize the plugin
     */
    public function onPluginsInitialized()
    {
        // Don't proceed if we are in the admin plugin
        if ($this->isAdmin()) {
            return;
        }

        $this->configs = $this->config->get('plugins.stripe-shop');
        // Enable the main event we are interested in
        $this->enable([
            'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0],
            'onAssetsInitialized' => ['onAssetsInitialized', 0]
        ]);

        $uri = $this->grav['uri'];
        if ($this->configs['checkout_route'] == $uri->path()) {
            $this->enable([
                'onPagesInitialized' => ['addCheckoutPage', 0]
            ]);
        }
    }

    /**
     * Add page template types.
     * @param Event $event
     */
    public function onGetPageTemplates(Event $event)
    {
        /** @var Types $types */
        $types = $event->types;
        $types->scanTemplates('plugins://stripe-shop/templates');
    }

    /**
     * Add page blueprints types.
     * @param Event $event
     */
    public function onGetPageBlueprints(Event $event)
    {
        /** @var Types $types */
        $types = $event->types;
        $types->scanBlueprints('plugins://stripe-shop/blueprints');
    }

    /**
     * Add current directory to twig lookup paths.
     */
    public function onTwigTemplatePaths()
    {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/templates';
    }

    /**
     * Handles initializing the assets
     */
    public function onAssetsInitialized()
    {
        /** @var Assets $assets */
        $assets = $this->grav['assets'];
        $assets->addJs('https://js.stripe.com/v3/');
        $assets->addJs('plugins://stripe-shop/js/base.js');
        $assets->addJs('plugins://stripe-shop/js/events.js');
        $assets->addJs('plugins://stripe-shop/js/ui.js');
        $assets->addCss('plugin://stripe-shop/css/stripe-shop.css');

        $global = "if (!window.PLUGIN_STRIPE_CHECKOUT) { window.PLUGIN_STRIPE_CHECKOUT = {}; }";
        $json_configs = json_encode($this->configs);
        $js = "window.PLUGIN_STRIPE_CHECKOUT.settings = {$json_configs};";
        $assets->addInlineJs($global);
        $assets->addInlineJs($js);
    }

    public function addCheckoutPage()
    {
        $this->addPage($this->configs['checkout_route'], 'shop_checkout.md');
    }

    public function addPage($url, $filename)
    {
        /** @var Pages $pages */
        $pages = $this->grav['pages'];
        $page = $pages->dispatch($url);

        if (!$page) {
            $page = new Page;
            $page->init(new \SplFileInfo(__DIR__ . '/pages/' . $filename));
            $page->slug(basename($url));
            $pages->addPage($page, $url);
        }
    }

    /**
     * Set needed variables to display cart.
     */
    public function onTwigSiteVariables()
    {
        if ($this->config->get('plugins.stripe-shop.built_in_css')) {
            $this->grav['assets']->add('plugin://stripe-shop/css/stripe-shop.css');
        }
    }
}
