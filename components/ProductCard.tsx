import { Card } from "@/components/ui/card"
import { Product } from "@/lib/types"
import { formatPrice } from "@/lib/api"

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
      <div className="aspect-square relative overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mb-3 mx-auto">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-gray-500 font-medium">Coming Soon</span>
            </div>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
          <span className="text-orange-600 font-bold text-sm">{formatPrice(product.priceCents)}</span>
        </div>
        
        {/* Status Badge */}
        {product.status === 'available' && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            AVAILABLE
          </div>
        )}
        {product.status === 'unavailable' && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            SOLD OUT
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-orange-600 transition-colors duration-300">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Action Button */}
        <button className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-orange-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
          Add to Order
        </button>
      </div>
    </Card>
  );
}

