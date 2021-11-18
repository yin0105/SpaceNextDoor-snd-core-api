const AuthRoute = require('./routes/AuthRoute');
const OAuthRoute = require('./routes/OAuthRoute');
const PhotosRoute = require('./routes/PhotosRoute');
const ProvidersRoute = require('./routes/ProvidersRoute');
const OrdersRoute = require('./routes/OrdersRoute');
const SpecialtiesRoute = require('./routes/SpecialtiesRoute');
const ChatRoute = require('./routes/ChatRoute');
const LiteChatRoute = require('./routes/LiteChatRoute');
const MediaRoute = require('./routes/MediaRoute');
const ReviewsRoute = require('./routes/ReviewsRoute');
const LocationsRoute = require('./routes/LocationsRoute');
const CustomersRoute = require('./routes/CustomersRoute');
const PhotographyStylesRoute = require('./routes/PhotographyStylesRoute');
const UsersRoute = require('./routes/UsersRoute');
const CancellationPoliciesRoute = require('./routes/CancellationPoliciesRoute');
const CouponsRoute = require('./routes/CouponsRoute');
const FavoriteRoute = require('./routes/FavoriteRoute');
const FavoriteImagesRoute = require('./routes/FavoriteImagesRoute');
const LedgerRoute = require('./routes/LedgerRoute');
const CalendarItemsRoute = require('./routes/CalendarItemsRoute');
const WebhooksRoute = require('./routes/WebhooksRoute');
const BlockedWordsRoute = require('./routes/BlockedWordsRoute');
const XeroRoute = require('./routes/XeroRoute');
const SitemapRoute = require('./routes/SitemapRoute');
const StripeRoute = require('./routes/StripeRoute');

exports.plugin = {
  register: (plugin, options) => {
    // Register all routes
    AuthRoute(plugin, options);
    OAuthRoute(plugin, options);
    PhotosRoute(plugin, options);
    ProvidersRoute(plugin, options);
    OrdersRoute(plugin, options);
    SpecialtiesRoute(plugin, options);
    ChatRoute(plugin, options);
    LiteChatRoute(plugin, options);
    MediaRoute(plugin, options);
    ReviewsRoute(plugin, options);
    LocationsRoute(plugin, options);
    CustomersRoute(plugin, options);
    PhotographyStylesRoute(plugin, options);
    UsersRoute(plugin, options);
    CancellationPoliciesRoute(plugin, options);
    CouponsRoute(plugin, options);
    FavoriteRoute(plugin, options);
    FavoriteImagesRoute(plugin, options);
    LedgerRoute(plugin, options);
    CalendarItemsRoute(plugin, options);
    WebhooksRoute(plugin, options);
    BlockedWordsRoute(plugin, options);
    XeroRoute(plugin, options);
    SitemapRoute(plugin, options);
    StripeRoute(plugin, options);
  },
  name: 'api'
};