import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center text-center text-white"
        style={{
          backgroundImage: "url(/hero-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
            <h1 className="text-4xl md:text-6xl font-light tracking-wider mb-2">SPLIT</h1>
            <h2 className="text-2xl md:text-3xl font-light tracking-wider">CAFÉ</h2>
          </div>
          <p className="text-lg md:text-xl font-light">An orange grove inspired café...</p>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <p className="text-gray-600 mb-6 leading-relaxed">
          At SPLIT Café, we enjoy fresh food, delicious drinks
          <br />
          and summer vibes all year long.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Let's create happy new memories with those you
          <br />
          love.
        </p>
      </section>

      {/* Menu Section */}
      <section className="bg-teal-600 py-16 text-center text-white">
        <h2 className="text-3xl font-light mb-4">Menu</h2>
        <p className="text-teal-100 mb-12 max-w-2xl mx-auto">
          Split Café features some of the best of our delicious food.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button variant="outline" className="bg-white text-teal-600 border-white hover:bg-teal-50">
            DRINKS
          </Button>
          <Button variant="outline" className="bg-white text-teal-600 border-white hover:bg-teal-50">
            FOOD
          </Button>
          <Button variant="outline" className="bg-white text-teal-600 border-white hover:bg-teal-50">
            COFFEE
          </Button>
          <Button variant="outline" className="bg-white text-teal-600 border-white hover:bg-teal-50">
            BREAKFAST
          </Button>
        </div>

        <Button className="bg-teal-700 hover:bg-teal-800 text-white">DOWNLOAD OUR MENU</Button>
      </section>

      {/* Food Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-4 text-teal-600">Food</h2>
          <p className="text-center text-gray-600 mb-4">
            Carefully selected choice of food, made of our own seasonal fresh coffee to eat
          </p>
          <p className="text-center text-gray-600 mb-12">Please note our menu is seasonal and ingredients can vary.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Food Item 1 */}
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img src="/food-1.jpg" alt="Vegetarian Breakfast" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-medium mb-2">Vegetarian Breakfast</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Roasted red pepper with goat cheese, avocado, cherry tomato, spinach with a fried egg on top.
                </p>
                <p className="text-sm text-gray-600 mb-4">Please inform staff of any food allergies or intolerances.</p>
                <div className="text-right">
                  <span className="text-lg font-medium">$22.00</span>
                </div>
              </div>
            </Card>

            {/* Food Item 2 */}
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img src="/food-2.jpg" alt="Smoked Salmon Wrap" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-medium mb-2">Smoked Salmon Wrap</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Fresh smoked salmon, cream cheese, capers, red onion, rocket, cherry tomato.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Coffee served with soy, oat or full cream milk available on request.
                </p>
                <div className="text-right">
                  <span className="text-lg font-medium">$21.00</span>
                </div>
              </div>
            </Card>

            {/* Food Item 3 */}
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img src="/food-3.jpg" alt="Breakfast Sandwich" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-medium mb-2">Breakfast Sandwich</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Smoked ham and fresh avocado, tomatoes, greens, and grilled, wrapped in a tortilla.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Freshly baked daily, made of our fresh and crisp daily for an enhanced experience.
                </p>
                <div className="text-right">
                  <span className="text-lg font-medium">$19.50</span>
                </div>
              </div>
            </Card>

            {/* Food Item 4 */}
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img src="/food-4.jpg" alt="Breakfast Bowl" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-medium mb-2">Breakfast Bowl</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Fresh seasonal vegetables, quinoa, avocado, poached egg, with tahini dressing.
                </p>
                <div className="text-right">
                  <span className="text-lg font-medium">$18.00</span>
                </div>
              </div>
            </Card>

            {/* Food Item 5 */}
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img src="/food-5.jpg" alt="Garden Salad" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-medium mb-2">Garden Salad</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Mixed greens, cherry tomatoes, cucumber, red onion, with house vinaigrette.
                </p>
                <div className="text-right">
                  <span className="text-lg font-medium">$16.00</span>
                </div>
              </div>
            </Card>

            {/* Food Item 6 */}
            <Card className="overflow-hidden">
              <div className="aspect-square relative">
                <img src="/food-6.jpg" alt="Artisan Pizza" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-medium mb-2">Artisan Pizza</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Wood-fired pizza with fresh mozzarella, basil, and seasonal toppings.
                </p>
                <div className="text-right">
                  <span className="text-lg font-medium">$24.00</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
