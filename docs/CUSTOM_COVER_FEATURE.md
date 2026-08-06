# Custom Cover Designer

`/customize-cover` provides a Fabric.js canvas for cover artwork. Customers can choose a model/template, upload an image, add resizable and rotatable text or emoji layers, change text colour/size, reorder layers, remove objects, then add the resulting design to the existing cart.

Custom cart entries preserve the canvas JSON, final PNG preview, selected model/template, unit price and quantity. Checkout creates a `CustomDesign` record and attaches it to the normal `OrderItem`; payment, order status, tracking and confirmation flow stay unchanged.

The admin dashboard shows custom-cover previews, model/template details, quantity and canvas JSON, and provides a preview download link.
